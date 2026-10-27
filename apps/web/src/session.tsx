import { createContext, useContext } from 'react';
import type { SessionInfo } from '@ggo/shared';

export const SessionContext = createContext<SessionInfo | null>(null);

export function useSession(): SessionInfo {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a signed-in organization');
  return session;
}
