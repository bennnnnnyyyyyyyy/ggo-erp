# Read before modifying this codebase

> **For developers and AI agents** (Claude, Codex, Antigravity, Cursor, humans).
>
> Don't write speculative code. Every module is built from an approved plan in
> [`documentation/plans/`](documentation/plans/), which in turn comes from a research teardown in
> [`documentation/research/`](documentation/research/). Check the plan before you change a module.

1. **Rules:** [`agents.md`](agents.md).
2. **Status:** [`documentation/plans/checklist.md`](documentation/plans/checklist.md) and [`documentation/operations/WORKLOG.md`](documentation/operations/WORKLOG.md).
3. **Roadmap:** [`documentation/plans/MASTER_PLAN.md`](documentation/plans/MASTER_PLAN.md).
4. **How it works:** [`documentation/architecture/ARCHITECTURE.md`](documentation/architecture/ARCHITECTURE.md).
5. **Invariants:** every table has `org_id` and RLS; every route checks a permission; nothing customer-specific is hardcoded; `audit_log` is append-only.
