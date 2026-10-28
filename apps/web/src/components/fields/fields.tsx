import { useState, type ReactNode } from 'react';
import { formatMoney, inputToMinor, minorToInput, minorUnitsFor, type FieldDef, type RecordValues } from '@ggo/shared';
import { formatDate } from '../../lib/format';
import { Link } from '../../lib/router';
import { useSession } from '../../session';

// Inputs and read-only values for any field definition. Pages pass `lookups` so `ref` and
// `user` fields can show names and offer choices.

export type Option = { id: string; label: string; href?: string };

export type Lookups = {
  /** Choices for `ref` fields, by the field's `ref` name (companies, contacts, stages…). */
  refs: Record<string, Option[]>;
  users: Option[];
};

export function optionLabel(options: Option[] | undefined, id: unknown): string {
  if (typeof id !== 'string') return '';
  return options?.find((o) => o.id === id)?.label ?? '';
}

function MoneyInput({ value, currency, onChange }: { value: number; currency: string; onChange: (v: number | null) => void }) {
  const digits = minorUnitsFor(currency || 'USD');
  const [text, setText] = useState(value ? minorToInput(value, digits) : '');
  return (
    <input
      inputMode="decimal"
      value={text}
      placeholder="0"
      onChange={(e) => {
        setText(e.target.value);
        onChange(inputToMinor(e.target.value, digits));
      }}
    />
  );
}

export function FieldInput({
  field,
  values,
  lookups,
  onChange,
}: {
  field: FieldDef;
  values: RecordValues;
  lookups: Lookups;
  onChange: (key: string, value: unknown) => void;
}) {
  const v = values[field.key];
  const set = (value: unknown) => onChange(field.key, value);
  const str = typeof v === 'string' ? v : '';

  switch (field.type) {
    case 'longtext':
      return <textarea rows={3} maxLength={field.max} value={str} onChange={(e) => set(e.target.value)} />;
    case 'enum':
      return (
        <select value={str} onChange={(e) => set(e.target.value)} className="capitalize">
          {!field.required && <option value="">—</option>}
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'ref':
    case 'user': {
      const options = field.type === 'user' ? lookups.users : (lookups.refs[field.ref ?? ''] ?? []);
      return (
        <select value={str} onChange={(e) => set(e.target.value || null)}>
          {!field.required && <option value="">—</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case 'date':
      return <input type="date" value={str.slice(0, 10)} onChange={(e) => set(e.target.value || null)} />;
    case 'money':
      return <MoneyInput value={typeof v === 'number' ? v : 0} currency={String(values.currency ?? '')} onChange={set} />;
    case 'int':
      return <input type="number" min={0} step={1} value={typeof v === 'number' ? v : ''} onChange={(e) => set(e.target.value === '' ? 0 : Number(e.target.value))} />;
    case 'currency':
      return <input maxLength={3} value={str} onChange={(e) => set(e.target.value.toUpperCase())} />;
    case 'tags':
      return (
        <input
          value={Array.isArray(v) ? v.join(', ') : str}
          placeholder="Comma separated"
          onChange={(e) => set(e.target.value)}
        />
      );
    case 'email':
      return <input type="email" value={str} onChange={(e) => set(e.target.value)} />;
    case 'phone':
      return <input type="tel" value={str} onChange={(e) => set(e.target.value)} />;
    default:
      return <input value={str} maxLength={field.max} onChange={(e) => set(e.target.value)} />;
  }
}

export function FieldValue({ field, values, lookups }: { field: FieldDef; values: RecordValues; lookups: Lookups }): ReactNode {
  const session = useSession();
  const v = values[field.key];
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return <span className="muted">—</span>;
  switch (field.type) {
    case 'ref':
    case 'user': {
      const options = field.type === 'user' ? lookups.users : lookups.refs[field.ref ?? ''];
      const opt = options?.find((o) => o.id === v);
      if (!opt) return <span className="muted">—</span>;
      return opt.href ? <Link to={opt.href}>{opt.label}</Link> : opt.label;
    }
    case 'money':
      return formatMoney({ amountMinor: Number(v), currency: String(values.currency ?? session.org?.defaultCurrency ?? 'USD') });
    case 'date':
      return formatDate(String(v), session.org);
    case 'url':
      return (
        <a href={String(v)} target="_blank" rel="noreferrer noopener">
          {String(v).replace(/^https?:\/\//, '')}
        </a>
      );
    case 'email':
      return <a href={`mailto:${String(v)}`}>{String(v)}</a>;
    case 'phone':
      return <a href={`tel:${String(v)}`}>{String(v)}</a>;
    case 'tags':
      return (
        <span className="tags">
          {(v as string[]).map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </span>
      );
    case 'enum':
      return <span className="capitalize">{String(v)}</span>;
    case 'longtext':
      return <span className="pre-wrap">{String(v)}</span>;
    default:
      return String(v);
  }
}
