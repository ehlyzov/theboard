# W011 — consistent annotation panel and direct magnetic docking

Status: active. Owner: TheBoard chat. Human acceptance: pending.
Base: `434f363aae1745cbc0fe09ce9cee26d590f23830`.
Branch: `fix/context-panel-styles`.
Source: owner screenshots, 2026-11-09, showing mismatched native selects and
crowded labels/buttons in both the mask-to-note and note-docking panels.

## Observable criteria before implementation

- UI-05: the mask-to-note panel uses the application's font, neutral/purple colors, rounded
  fields, inset chevrons and visible keyboard focus. Labels sit above their
  fields; actions are spaced and visually distinguish primary, secondary and
  disabled states.
- UI-06: the mask-to-note panel fits their available width, including long note/screen
  choices. The mask panel wraps actions on a narrow viewport. Keep its native
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

## Accepted scope update before magnetic docking implementation

The owner then explicitly replaced the docking picker with a magnet icon:
press/hold/drag to a screen side, or click/release then click a screen side.
The old docking form is removed, not restyled. Existing docking persistence,
full-side sizing, outward edge routing and detach behavior remain obligations.

- DOCK-02: magnet drag/release attaches to the highlighted target side, all four
  sides; clicking the magnet arms the same targets for a subsequent click.
- DOCK-03: targets identify screen and side, support keyboard activation and
  remain usable at board zoom. Escape/cancel or an invalid drag changes no
  board data or node positions. No duplicate notes or implicit navigation edges.
- DOCK-04: magnet on an attached note detaches it, preserving content and color;
  stored dock fields and archive representation remain unchanged.

New gesture checks precede behavior. Existing docking/mask regression setup is
adapted from the removed dropdowns to side targets without removing assertions.
