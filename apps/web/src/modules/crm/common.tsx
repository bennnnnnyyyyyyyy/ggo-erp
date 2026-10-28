import { useState, type ReactNode } from 'react';
import { hasPermission, type FieldDef, type RecordValues } from '@ggo/shared';
import type { Lookups } from '../../components/fields/fields';
import { Modal } from '../../components/Modal';
import { RecordForm } from '../../components/views/RecordForm';
import { api } from '../../lib/api';
import { navigate } from '../../lib/router';
import { useSession } from '../../session';

export function useCanManageCrm(): boolean {
  return hasPermission(useSession().permissions, 'crm.records.manage');
}

/** "New …" button that opens a form and goes to the new record's page when saved. */
export function NewRecordButton({
  noun,
  fields,
  lookups,
  apiPath,
  pagePath,
  initial,
}: {
  noun: string;
  fields: readonly FieldDef[];
  lookups: Lookups;
  apiPath: string;
  pagePath: string;
  initial: RecordValues;
}) {
  const [open, setOpen] = useState(false);
  if (!useCanManageCrm()) return null;
  return (
    <>
      <button onClick={() => setOpen(true)}>New {noun}</button>
      {open && (
        <Modal title={`New ${noun}`} onClose={() => setOpen(false)}>
          <RecordForm
            fields={fields}
            initial={initial}
            lookups={lookups}
            submitLabel={`Create ${noun}`}
            onCancel={() => setOpen(false)}
            onSubmit={async (values) => {
              const created = await api<{ id: string }>(apiPath, { method: 'POST', body: JSON.stringify(values) });
              navigate(`${pagePath}/${created.id}`);
            }}
          />
        </Modal>
      )}
    </>
  );
}

export function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {intro && <p className="muted">{intro}</p>}
      </div>
      <span className="spacer" />
      {children}
    </header>
  );
}

export function Loading({ error }: { error: string | null }) {
  return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
}
