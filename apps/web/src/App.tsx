import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { SessionInfo } from '@ggo/shared';
import { api, getActiveOrgId, setActiveOrgId } from './lib/api';
import { supabase } from './lib/supabase';
import { SessionContext } from './session';
import { SignIn } from './components/SignIn';
import { OrgPicker } from './components/OrgPicker';
import { Shell } from './components/Shell';

export function App() {
  const [auth, setAuth] = useState<Session | null | undefined>(undefined);
  const [orgId, setOrgId] = useState<string | null>(getActiveOrgId());
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuth(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setAuth(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setSession(null);
    if (!auth || !orgId) return;
    api<SessionInfo>('/v1/core/session')
      .then(setSession)
      .catch((e: Error) => {
        setError(e.message);
        chooseOrg(null);
      });
  }, [auth, orgId]);

  function chooseOrg(id: string | null) {
    if (id) setError(null);
    setActiveOrgId(id);
    setOrgId(id);
  }

  if (auth === undefined) return null;
  if (!auth) return <SignIn />;
  if (!orgId) {
    return (
      <>
        {error && <p className="error banner">{error}</p>}
        <OrgPicker onPick={chooseOrg} />
      </>
    );
  }
  if (!session) return <main className="center"><p className="muted">Loading…</p></main>;

  return (
    <SessionContext.Provider value={session}>
      <Shell
        onSwitchOrg={() => chooseOrg(null)}
        onSignOut={() => {
          chooseOrg(null);
          supabase.auth.signOut();
        }}
      />
    </SessionContext.Provider>
  );
}
