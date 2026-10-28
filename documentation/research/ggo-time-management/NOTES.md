# GGO Time Management (existing internal app): notes for M3

**Source:** `Desktop/GGO-time-management` (GGO's own app, React + Supabase, ~17 users). Read 2026-10-28.
**Why:** Ben pointed to it for how breaks work (INPUT_NEEDED question 8). It is GGO's own code,
so the ERP can follow its behaviour closely; staff already know it.

## What it does (relevant to Time & attendance)

| Area | Behaviour |
|---|---|
| Clock in / out | `time_entries`: clock-in and clock-out times with **GPS** (lat/lng) at both; status active / on break / completed |
| Breaks and statuses | Staff set a **status** ("disposition"): Active, On Break, AFK, In Meeting, On Call, Offline. Statuses are customizable, each **paid or unpaid** (On Break and AFK unpaid). Every status change during a shift is logged as a segment (`time_entry_breaks`), so several breaks per shift all deduct from paid hours |
| Over-limit alerts | When someone stays too long in a status, managers in the same department and admins are notified (scheduled job) |
| Live team status | A board showing who is active, on break, AFK, in a meeting, per department |
| Shifts | Scheduled blocks per person (draft / published / cancelled); managers publish |
| Timesheets | Weekly roll-up per person: total and overtime hours, draft → submitted → approved / rejected, notes |
| Overtime | Rules with daily and weekly thresholds and a multiplier (default 8 h / 40 h / 1.5×) |
| Departments | Staff grouped by department; managers see their department |
| Mobile | Phone access gated per user; push notifications |
| Also present (out of M3 scope) | Chat, announcements, events, forms, help desk, knowledge base, tasks |

## Lessons from its PERFORMANCE.md

Presence heartbeats broadcast to every client caused an N² Realtime traffic storm on the free
plan. For the ERP: no per-minute broadcasts to all clients; status changes only, and lists
fetched on demand.

## Implications for the M3 plan

- Model work time as **segments by status** (paid / unpaid), not a single break pair.
- Departments = the "teams" the MVP plan needs for team-lead approval and own/team visibility.
- Shifts exist today, so late / missing clock-in reporting can compare against them.
- Keep GPS on clock in/out as an org setting (some customers won't want it).
