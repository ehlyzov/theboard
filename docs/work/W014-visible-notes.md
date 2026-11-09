# W014 — visible new notes and transparent composite corners

Status: active. Owner: TheBoard chat (single writer).
Base: `0e17fa6b7a1a72a115c7c76ba7d13727e0aa0b61`.
Branch: `fix/visible-new-notes`. Human acceptance: pending.
Sources: owner's local-board report and empty white corner screenshot,
2026-11-09. No private board is used as a fixture.

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
