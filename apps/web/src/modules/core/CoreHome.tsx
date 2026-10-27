import { useSession } from '../../session';

export function CoreHome() {
  const session = useSession();
  return (
    <section>
      <h1>{session.org?.name}</h1>
      <p className="muted">
        Signed in as {session.email} ({session.role}). Enabled modules: {session.modules.join(', ')}.
      </p>
    </section>
  );
}
