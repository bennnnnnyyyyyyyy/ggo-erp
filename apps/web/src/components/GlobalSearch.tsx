import { useEffect, useRef, useState } from 'react';
import type { SearchHit } from '@ggo/shared';
import { api } from '../lib/api';
import { navigate } from '../lib/router';

const HREF: Record<SearchHit['type'], string> = {
  company: '/crm/companies/',
  contact: '/crm/contacts/',
  deal: '/crm/deals/',
};

const TYPE_LABEL: Record<SearchHit['type'], string> = { company: 'Company', contact: 'Contact', deal: 'Deal' };

// Top-bar search across CRM records. Ctrl+K (or ⌘K) focuses it; arrows and Enter pick a result.
export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let live = true;
    const t = window.setTimeout(() => {
      api<SearchHit[]>(`/v1/crm/search?q=${encodeURIComponent(term)}`)
        .then((h) => {
          if (!live) return;
          setHits(h);
          setActive(0);
        })
        .catch(() => live && setHits([]));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [q]);

  function go(hit: SearchHit) {
    navigate(HREF[hit.type] + hit.id);
    setQ('');
    setOpen(false);
    input.current?.blur();
  }

  return (
    <div className="search">
      <input
        ref={input}
        type="search"
        placeholder="Search (Ctrl+K)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, hits.length - 1));
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' && hits[active]) go(hits[active]);
          else if (e.key === 'Escape') input.current?.blur();
        }}
        aria-label="Search companies, contacts and deals"
      />
      {open && q.trim().length >= 2 && (
        <div className="search-results" role="listbox">
          {hits.length === 0 && <div className="muted small search-empty">No matches</div>}
          {hits.map((h, i) => (
            <button
              key={`${h.type}-${h.id}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'search-hit active' : 'search-hit'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(h)}
            >
              <span className="search-type small muted">{TYPE_LABEL[h.type]}</span>
              <span>{h.title}</span>
              {h.subtitle && <span className="muted small capitalize">{h.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
