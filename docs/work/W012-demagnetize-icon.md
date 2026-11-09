# W012 — distinct demagnetize action

Status: review. Owner: TheBoard chat. Human acceptance pending.
Base: `2d39588ccc82922ca08a2b5c2f78f0508fc06c51`.
Source: owner screenshot/request, 2026-11-09: a docked note must display a
crossed-out magnet representing the demagnetize action.

Criteria recorded before implementation:
- DOCK-05: attached note shows a diagonal slash across the existing magnet,
  tooltip "Размагнитить" and accessible action "Размагнитить заметку".
  Detaching restores the plain magnet and attach action, also after reload.
- Existing attach/detach gestures, note content, color, geometry and portable
  data remain unchanged. This is presentation/copy only.

Cosmetic verification: inspect both icon states and tooltip/accessible names;
run existing docking/magnet regressions, adapting only the renamed action in
locators. Do not add implementation-mirroring icon tests. Fresh-context review
of the exact candidate and green protected CI/Pages deployment remain required.
Technical result: author build and nine affected regressions PASS.
The existing Lucide magnet composes a diagonal slash only when dock data exists;
its SVG stays decorative, and the button has the requested accessible action.
No event handler, style, schema, geometry or dependency changes. Existing tests
change only the renamed detach action locator; assertions are unchanged.
`npm run build`, existing docking/magnet tests on dedicated4362, and
`git diff --check`: PASS. Visual state/reload review and protected rollout next.
