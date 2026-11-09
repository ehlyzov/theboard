# W014 — visible new notes and transparent composite corners

Status: review. Owner: TheBoard chat (single writer).
Base: `0e17fa6b7a1a72a115c7c76ba7d13727e0aa0b61`.
Branch: `fix/visible-new-notes`. Human acceptance: pending.
Sources: owner's local-board report and empty white corner screenshot,
2026-11-09. No private board is used as a fixture.

Additional owner screenshot21:33: remove the purple rectangle around the note
textarea while typing (NOTE-05). Keep DOM focus/caret and the note's selection.
Validate the narrow CSS change by visual/computed focus inspection and typing;
do not add an implementation-mirroring cosmetic test.

## Criteria before implementation

- NOTE-04: toolbar Add note creates one selected ordinary note in view and
  focuses its text for immediate typing, independent of existing note count,
  pan and zoom. Existing manual positions/content remain unchanged. Repeated
  creation reveals the newest note. Automatic placement must still reveal it
  after the solver finishes. Creating an unlinked note exits focus so it is
  visible; automatic layout remains enabled when it was enabled.
- DOCK-07: empty corners of mixed-side screen/note groups show the canvas,
  without a white rectangle/border/shadow around the group's bounding box.
  The screen core retains its card surface and selection indication. Preserve
  docking dimensions, controls, connections and saved geometry.

Checks: synthetic populated board (>57 notes), distant saved pan and low/high
zoom; manual and automatic/focus creation, selection, keyboard typing and reload.
Reuse mixed-side dock/connector regression tests; visually inspect the synthetic
corner at useful zoom. Record test-only red before behavior. One independent
fresh-context reviewer checks the exact candidate, without modifying files.

Publication depends on PR12's navigation synchronization repair. GitHub Actions
is currently reporting an external outage; green required checks remain a gate.
No bypass or claim of a live update while deployment is blocked.

## Author checkpoint

Test-only `e9993a5`: three meaningful failures (new note unselected at15%/400%,
focus remained enabled). Original traces retained in `/tmp/theboard-w014-red`.
The new export check initially read position from the wrong archive field and
the automatic fixture used an internal rather than portable setting; corrected
to `layout.nodes[id]` and `layout.automatic`, retaining the same assertions.

Creation no longer offsets by total note count. It clears selection, exits
focus, creates at the viewport center and frames the measured card for editing.
Manual geometry stays unchanged; automatic mode reveals after solver placement.
Text focus follows viewport fitting (early focus was superseded by React Flow's
selection focus). A sequence guard prevents an older fit from stealing focus
after another new note. The group's transparent1px boundary preserves measured
dimensions; surface/outline/shadow now belong only to the screen core.

Author build and full48/48 PASS; Pages build and2/2 PASS. Mixed-side core widths
and selected link geometry remain green. Synthetic corner capture:
`output/playwright/w014-transparent-corner.png`: author visually confirmed the
bottom-right empty cell shows the canvas dots while the core and both docked
notes retain their surfaces. Local4173 preview serves the rebuilt candidate.
Independent exact-SHA review of `a2ed0b6cc8bd00cc848a1882b9d7edad3296f082`
is in progress. Other browser engines remain unverified.
