import { useState, type FormEvent } from 'react';
import { validateRecord, type FieldDef, type RecordValues } from '@ggo/shared';
import { FieldInput, type Lookups } from '../fields/fields';

// A create / edit form for any record, from its field definitions. Validates with the same
// rules as the API before sending, then shows the API's message if it still refuses.

export function RecordForm({
  fields,
  initial,
  lookups,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  fields: readonly FieldDef[];
  initial: RecordValues;
  lookups: Lookups;
  submitLabel: string;
  /** Receives only changed keys when editing, all keys when creating. */
  onSubmit: (values: RecordValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<RecordValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editable = fields.filter((f) => f.editable !== false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const moneyBad = editable.find((f) => f.type === 'money' && values[f.key] === null);
    if (moneyBad) {
      setErrors({ [moneyBad.key]: `${moneyBad.label} must be a number with up to 2 decimals` });
      return;
    }
    const check = validateRecord(editable, values);
    setErrors(check.errors);
    if (Object.keys(check.errors).length) return;
    const changed: RecordValues = {};
    for (const f of editable) {
      if (JSON.stringify(check.values[f.key]) !== JSON.stringify(initial[f.key] ?? (f.type === 'tags' ? [] : null))) {
        changed[f.key] = check.values[f.key];
      }
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(initial.id ? changed : check.values);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="form-grid">
        {editable.map((f) => (
          <label key={f.key} className={f.type === 'longtext' ? 'span-2' : undefined}>
            {f.label}
            {f.required && <span className="required"> *</span>}
            <FieldInput field={f} values={values} lookups={lookups} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
            {errors[f.key] && <span className="error small">{errors[f.key]}</span>}
          </label>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
