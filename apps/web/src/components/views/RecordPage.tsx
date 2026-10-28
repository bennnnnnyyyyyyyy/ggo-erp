import { useState, type ReactNode } from 'react';
import { formatMoney, type FieldDef, type RecordValues } from '@ggo/shared';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Link, navigate } from '../../lib/router';
import { useSession } from '../../session';
import { FieldValue, optionLabel, type Lookups } from '../fields/fields';
import { Modal } from '../Modal';
import { RecordForm } from './RecordForm';
import { Timeline } from './Timeline';

// The shared Record page: a header with actions, the record's fields, related lists supplied by
// the module, and the activity timeline on the right.

export function RecordPage({
  title,
  subtitle,
  record,
  fields,
  lookups,
  entityType,
  apiPath,
  back,
  noun,
  canManage,
  headerExtra,
  related,
  onChanged,
}: {
  title: string;
  subtitle?: ReactNode;
  record: RecordValues & { id: string };
  fields: readonly FieldDef[];
  lookups: Lookups;
  entityType: string;
  /** e.g. `/v1/crm/companies` */
  apiPath: string;
  back: { label: string; to: string };
  noun: string;
  canManage: boolean;
  headerExtra?: ReactNode;
  related?: ReactNode;
  onChanged: (record: RecordValues & { id: string }) => void;
}) {
  const session = useSession();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineKey, setTimelineKey] = useState(0);

  async function save(values: RecordValues) {
    const updated = await api<RecordValues & { id: string }>(`${apiPath}/${record.id}`, { method: 'PATCH', body: JSON.stringify(values) });
    onChanged(updated);
    setEditing(false);
    setTimelineKey((k) => k + 1);
  }

  async function remove() {
    if (!window.confirm(`Delete this ${noun}? It disappears from lists; the change is kept in the audit log.`)) return;
    try {
      await api(`${apiPath}/${record.id}`, { method: 'DELETE' });
      navigate(back.to);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Turns stored values in the change history into readable text.
  function describeValue(key: string, value: unknown): string | null {
    const f = fields.find((x) => x.key === key);
    if (!f) return null;
    if (value === null || value === undefined || value === '') return '';
    if (f.type === 'ref') return optionLabel(lookups.refs[f.ref ?? ''], value) || '(removed)';
    if (f.type === 'user') return optionLabel(lookups.users, value) || '(former member)';
    if (f.type === 'money') return formatMoney({ amountMinor: Number(value), currency: String(record.currency ?? session.org?.defaultCurrency ?? 'USD') });
    if (f.type === 'date') return formatDate(String(value), session.org);
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  return (
    <div className="record-page">
      <div className="record-main">
        <Link to={back.to} className="back-link small">
          ← {back.label}
        </Link>
        <header className="record-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <div className="muted">{subtitle}</div>}
          </div>
          <span className="spacer" />
          {headerExtra}
          {canManage && (
            <>
              <button onClick={() => setEditing(true)}>Edit</button>
              <button className="secondary" onClick={remove}>
                Delete
              </button>
            </>
          )}
        </header>
        {error && <p className="error">{error}</p>}

        <dl className="details">
          {fields.map((f) => (
            <div key={f.key} className={f.type === 'longtext' ? 'detail span-2' : 'detail'}>
              <dt>{f.label}</dt>
              <dd>
                <FieldValue field={f} values={record} lookups={lookups} />
              </dd>
            </div>
          ))}
        </dl>

        {related}
      </div>

      <Timeline
        key={timelineKey}
        entityType={entityType}
        entityId={record.id}
        canManage={canManage}
        users={lookups.users}
        describeValue={describeValue}
        labelOf={(key) => fields.find((f) => f.key === key)?.label ?? key}
      />

      {editing && (
        <Modal title={`Edit ${noun}`} onClose={() => setEditing(false)}>
          <RecordForm fields={fields} initial={record} lookups={lookups} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} />
        </Modal>
      )}
    </div>
  );
}
