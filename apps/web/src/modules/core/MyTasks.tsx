import type { MyTask } from '@ggo/shared';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { Link } from '../../lib/router';
import { useLoad } from '../../lib/useLoad';
import { useSession } from '../../session';

// Where each record type's page lives, for linking a task back to its record.
const RECORD_PATH: Record<string, string> = {
  crm_company: '/crm/companies/',
  crm_contact: '/crm/contacts/',
  crm_deal: '/crm/deals/',
};

/** "My day": open tasks assigned to me, overdue first. */
export function MyTasks() {
  const session = useSession();
  const tasks = useLoad(() => api<MyTask[]>('/v1/core/activities/mine'));
  const now = Date.now();

  async function done(t: MyTask) {
    await api(`/v1/core/activities/${t.id}`, { method: 'PATCH', body: JSON.stringify({ done: true }) });
    tasks.setData((tasks.data ?? []).filter((x) => x.id !== t.id));
  }

  return (
    <div className="card-panel">
      <h2>My tasks</h2>
      {tasks.error && <p className="error small">{tasks.error}</p>}
      {tasks.data?.length === 0 && <p className="muted small">Nothing due. Tasks you add on a record show up here.</p>}
      <ul className="task-list">
        {tasks.data?.map((t) => {
          const overdue = t.dueAt && Date.parse(t.dueAt) < now;
          const path = RECORD_PATH[t.entityType];
          return (
            <li key={t.id}>
              <input type="checkbox" onChange={() => void done(t)} aria-label="Mark done" />
              <div>
                <div>{t.subject ?? t.body}</div>
                <div className="muted small">
                  {path ? <Link to={path + t.entityId}>{t.entityTitle}</Link> : t.entityTitle}
                  {t.dueAt && <span className={overdue ? 'overdue' : undefined}> · due {formatDateTime(t.dueAt, session.org)}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
