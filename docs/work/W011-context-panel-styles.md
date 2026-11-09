# W011 — consistent annotation and docking panels

Status: active. Owner: TheBoard chat. Human acceptance: pending.
Base: `434f363aae1745cbc0fe09ce9cee26d590f23830`.
Branch: `fix/context-panel-styles`.
Source: owner screenshots, 2026-11-09, showing mismatched native selects and
crowded labels/buttons in both the mask-to-note and note-docking panels.

## Observable criteria before implementation

- UI-05: both panels use the application's font, neutral/purple colors, rounded
  fields, inset chevrons and visible keyboard focus. Labels sit above their
  fields; actions are spaced and visually distinguish primary, secondary and
  disabled states.
- UI-06: both panels fit their available width, including long note/screen
  choices. The mask panel wraps actions on a narrow viewport. Keep the native
  select semantics and all existing accessible names/keyboard operation.
- UI-07: linking an existing note, creating a linked note, cancellation and
  docking/undocking still work. No stored data, schema or layout behavior changes.

Cosmetic change: the owner's screenshots are the pre-change visual evidence;
no artificial red or new implementation-mirroring tests. Verify synthetic
panels visually in a clean browser, including keyboard focus and narrow width;
run the existing annotation/docking regression cases. Independent fresh-context
review follows the exact candidate. Existing hosted checks and main deployment
must be green before delivery; record final rollout evidence in the PR.
Technical verdict: NOT_RUN. Next: scoped presentation changes and verification.
