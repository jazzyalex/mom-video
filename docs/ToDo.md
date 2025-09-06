# To‑Do

Short, focused list of next steps.

- Tighten Realtime Database rules
  - Allow writes to `rooms/*` and `sessions/*` with field validation.
  - Add basic TTL cleanup (client or Cloud Function) to remove stale rooms/sessions.

- TURN security
  - Move to ephemeral TURN credentials via coturn REST (`use-auth-secret`).
  - Serve `turns:` on 5349/443 with a valid certificate; keep UDP 3478 as available.

- Diagnostics
  - Add optional `getStats()` dump on connect and log selected ICE pair (only when `?debug=1`).
  - Add a “Скопировать отчёт” button (visible only with `?debug=1`) to copy a compact JSON summary of meta + last N logs.

- UX Polish
  - Auto-hide status chip sooner after connect and avoid overlap with the PiP.
  - Add simple ringtone/vibration on incoming connect (optional).

- Code simplification
  - Remove legacy retry pathways if stability remains good.
  - Consolidate media constraints to a single conservative preset (already active).

- Testing matrix
  - Home↔Home (different ISPs), Corporate/Hotel↔Home, Mobile hotspot↔Home.
  - Record which candidate type was selected (host/srflx/relay) and outcomes.

- Documentation
  - Keep CHANGES.md current with each user-visible change.
  - Add short README note on how to fetch logs from `sessions/*`.
