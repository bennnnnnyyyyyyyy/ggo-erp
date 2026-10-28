import { useState, type FormEvent } from 'react';
import { ACTIVITY_KINDS, type Activity, type ActivityKind, type TimelineItem } from '@ggo/shared';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { useSession } from '../../session';
import { optionLabel, type Option } from '../fields/fields';

// The activity timeline on a record page: log a note, call, meeting or task, tick tasks off,
// and see the record's change history (from the audit log) in one stream.

const KIND_LABEL: Record<ActivityKind, string> = { note: 'Note', call: 'Call', meeting: 'Meeting', task: 'Task' };

function Composer({
  entityType,
  entityId,
  users,
  onAdded,
}: {
  entityType: string;
  entityId: string;
  users: Option[];
  onAdded: () => void;
}) {
  const session = useSession();
  const [kind, setKind] = useState<ActivityKind>('note');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [assigneeId, setAssigneeId] = useState(session.userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<Activity>('/v1/core/activities', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          entityId,
          kind,
          subject,
          body,
          dueAt: kind === 'task' && dueAt ? new Date(dueAt).toISOString() : null,
          assigneeId: kind === 'task' ? assigneeId : null,
        }),
      });
      setSubject('');
      setBody('');
      setDueAt('');
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="composer stack" onSubmit={submit}>
      <div className="segmented" role="tablist">
        {ACTIVITY_KINDS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={k === kind} className={k === kind ? 'seg active' : 'seg'} onClick={() => setKind(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {kind !== 'note' && (
        <input
          placeholder={kind === 'task' ? 'What needs doing?' : `${KIND_LABEL[kind]} subject`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
        />
      )}
      <textarea
        rows={kind === 'note' ? 3 : 2}
        placeholder={kind === 'note' ? 'Write a note…' : 'Details (optional)'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {kind === 'task' && (
        <div className="form-row">
          <label>
            Due
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </label>
          <label>
            Assigned to
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {error && <p className="error small">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={busy || (!subject.trim() && !body.trim())}>
          {busy ? 'Saving…' : `Add ${KIND_LABEL[kind].toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}

function describeChange(action: string, summary: string | null): string {
  if (action.endsWith('.created')) return 'Created';
  if (action.endsWith('.deleted')) return 'Deleted';
  const fields = summary?.split(': ')[1];
  return fields ? `Changed ${fields}` : (summary ?? action);
}

export function Timeline({
  entityType,
  entityId,
  canManage,
  users,
  describeValue,
  labelOf,
}: {
  entityType: string;
  entityId: string;
  canManage: boolean;
  users: Option[];
  /** Turns a changed field's stored value into display text (ids into names). */
  describeValue?: (key: string, value: unknown) => string | null;
  labelOf?: (key: string) => string;
}) {
  const session = useSession();
  const items = useLoad(() =>
    api<TimelineItem[]>(`/v1/core/timeline?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`),
  );
  const [error, setError] = useState<string | null>(null);

  async function toggleDone(a: Activity) {
    setError(null);
    try {
      await api(`/v1/core/activities/${a.id}`, { method: 'PATCH', body: JSON.stringify({ done: !a.doneAt }) });
      items.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(a: Activity) {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api(`/v1/core/activities/${a.id}`, { method: 'DELETE' });
      items.reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const who = (id: string | null) => (id ? optionLabel(users, id) || 'Someone' : 'System');

  return (
    <aside className="timeline">
      <h2>Activity</h2>
      {canManage && <Composer entityType={entityType} entityId={entityId} users={users} onAdded={items.reload} />}
      {error && <p className="error small">{error}</p>}
      {items.error && <p className="error small">{items.error}</p>}
      {items.data?.length === 0 && <p className="muted small">Nothing logged yet.</p>}
      <ol className="timeline-list">
        {items.data?.map((item) =>
          item.type === 'activity' ? (
            <li key={`a-${item.activity.id}`} className={`tl-item tl-${item.activity.kind}${item.activity.doneAt ? ' done' : ''}`}>
              <div className="tl-head">
                {item.activity.kind === 'task' && (
                  <input
                    type="checkbox"
                    checked={!!item.activity.doneAt}
                    onChange={() => toggleDone(item.activity)}
                    disabled={!canManage}
                    aria-label="Done"
                  />
                )}
                <span className="tl-kind">{KIND_LABEL[item.activity.kind]}</span>
                <span className="muted small">
                  {who(item.activity.createdBy)} · {formatDateTime(item.at, session.org)}
                </span>
                {canManage && (
                  <button className="link-btn small tl-delete" onClick={() => remove(item.activity)}>
                    Delete
                  </button>
                )}
              </div>
              {item.activity.subject && <div className="tl-subject">{item.activity.subject}</div>}
              {item.activity.body && <div className="pre-wrap">{item.activity.body}</div>}
              {item.activity.kind === 'task' && (
                <div className="muted small">
                  {item.activity.dueAt ? `Due ${formatDateTime(item.activity.dueAt, session.org)} · ` : ''}
                  {who(item.activity.assigneeId)}
                </div>
              )}
            </li>
          ) : (
            <li key={`c-${item.change.id}`} className="tl-item tl-change">
              <div className="tl-head">
                <span className="muted small">
                  {describeChange(item.change.action, item.change.summary)} · {who(item.change.actor_user_id)} ·{' '}
                  {formatDateTime(item.at, session.org)}
                </span>
              </div>
              {item.change.action.endsWith('.updated') && describeValue && typeof item.change.after === 'object' && item.change.after !== null && (
                <ul className="tl-diff small">
                  {Object.entries(item.change.after as Record<string, unknown>).map(([k, v]) => {
                    const before = (item.change.before as Record<string, unknown> | null)?.[k];
                    const from = describeValue(k, before);
                    const to = describeValue(k, v);
                    return to === null ? null : (
                      <li key={k}>
                        <span className="muted">{labelOf?.(k) ?? k}: </span>
                        {from ? `${from} → ` : ''}
                        <strong>{to || '—'}</strong>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ),
        )}
      </ol>
    </aside>
  );
}
