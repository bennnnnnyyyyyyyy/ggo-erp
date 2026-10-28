import { useState } from 'react';
import { STAGE_KINDS, hasPermission, type Stage, type StageKind } from '@ggo/shared';
import { api } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { useSession } from '../../session';
import { Loading, PageHeader } from './common';

function StageRow({ stage, canEdit, onSaved, onDeleted }: { stage: Stage; canEdit: boolean; onSaved: (s: Stage) => void; onDeleted: () => void }) {
  const [name, setName] = useState(stage.name);
  const [kind, setKind] = useState<StageKind>(stage.kind);
  const [position, setPosition] = useState(stage.position);
  const [error, setError] = useState<string | null>(null);
  const dirty = name !== stage.name || kind !== stage.kind || position !== stage.position;

  async function save() {
    setError(null);
    try {
      onSaved(await api<Stage>(`/v1/crm/stages/${stage.id}`, { method: 'PATCH', body: JSON.stringify({ name, kind, position }) }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the stage "${stage.name}"?`)) return;
    setError(null);
    try {
      await api(`/v1/crm/stages/${stage.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <tr>
      <td>
        <input type="number" className="narrow" value={position} disabled={!canEdit} onChange={(e) => setPosition(Number(e.target.value) || 0)} aria-label="Order" />
      </td>
      <td>
        <input value={name} maxLength={80} disabled={!canEdit} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        {error && <div className="error small">{error}</div>}
      </td>
      <td>
        <select value={kind} disabled={!canEdit} onChange={(e) => setKind(e.target.value as StageKind)} aria-label="Kind">
          {STAGE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </td>
      {canEdit && (
        <td className="row-actions">
          <button className="link-btn" disabled={!dirty} onClick={save}>
            Save
          </button>
          <button className="link-btn" onClick={remove}>
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}

export function PipelineSettings() {
  const session = useSession();
  const canEdit = hasPermission(session.permissions, 'crm.settings.manage');
  const stages = useLoad(() => api<Stage[]>('/v1/crm/stages'));
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!stages.data) return <Loading error={stages.error} />;
  const list = [...stages.data].sort((a, b) => a.position - b.position);

  async function add() {
    setError(null);
    const lastOpen = list.filter((s) => s.kind === 'open').pop();
    try {
      await api<Stage>('/v1/crm/stages', {
        method: 'POST',
        body: JSON.stringify({ name: newName, kind: 'open', position: (lastOpen?.position ?? 0) + 5 }),
      });
      setNewName('');
      stages.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Pipeline"
        intro="The stages a deal moves through. Won and lost stages close the deal. Lower numbers come first."
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Stage</th>
              <th>Kind</th>
              {canEdit && <th aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <StageRow
                key={`${s.id}-${s.position}-${s.name}-${s.kind}`}
                stage={s}
                canEdit={canEdit}
                onSaved={() => stages.reload()}
                onDeleted={() => stages.reload()}
              />
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <form
          className="add-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) void add();
          }}
        >
          <input placeholder="New stage name" value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} />
          <button type="submit" disabled={!newName.trim()}>
            Add stage
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      {!canEdit && <p className="muted small">Only owners and admins can change the pipeline.</p>}
    </section>
  );
}
