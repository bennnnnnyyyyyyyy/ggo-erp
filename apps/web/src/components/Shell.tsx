import { useState } from 'react';
import { MODULES, hasPermission } from '@ggo/shared';
import { MODULE_PAGES, type ModulePage } from '../modules/registry';
import { useSession } from '../session';

export function Shell({ onSwitchOrg, onSignOut }: { onSwitchOrg: () => void; onSignOut: () => void }) {
  const session = useSession();
  const sections = MODULES.filter((m) => session.modules.includes(m.key)).map((m) => ({
    module: m,
    pages: (MODULE_PAGES[m.key] ?? []).filter((p) => !p.permission || hasPermission(session.permissions, p.permission)),
  }));
  const first = sections.flatMap((s) => s.pages)[0];
  const [current, setCurrent] = useState<ModulePage | undefined>(first);
  const Page = current?.component;

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="org">{session.org?.name}</div>
        {sections.map(({ module, pages }) =>
          pages.length === 0 ? null : (
            <div key={module.key} className="nav-section">
              <div className="nav-heading">{module.name}</div>
              {pages.map((p) => (
                <button
                  key={p.path}
                  className={p === current ? 'nav-item active' : 'nav-item'}
                  onClick={() => setCurrent(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ),
        )}
        <div className="nav-footer">
          <button className="secondary" onClick={onSwitchOrg}>Switch organization</button>
          <button className="secondary" onClick={onSignOut}>Sign out</button>
        </div>
      </nav>
      <main className="content">{Page ? <Page /> : <p className="muted">Nothing to show yet.</p>}</main>
    </div>
  );
}
