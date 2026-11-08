# W008 — contextual marker size slider

Status: review. Owner: TheBoard chat. Branch: feat/contextual-marker-size.
Base:1c6d339a87997822daf3087a8b26eb60707ec42c. Human acceptance pending.

Source: direct owner request,2026-11-08: when a marker is selected, show a
size slider beside its icon; keyboard size controls were hard to discover.
This explicitly supersedes MASK-12's earlier keyboard-only/no-slider decision.

MASK-13: show one contextual size slider with a numeric percentage adjacent to
only the active screen marker. Hide it when drawing ends/cancels. Keep existing
1..20% range and [ / ] shortcuts synchronized. Pointer and keyboard input must
change brush size without moving a card, creating a mask or losing strokes.
The control should stay usable at canvas zoom, without changing composite
measurements or canonical layout. No new persisted board fields.

Checks before behavior: tests/regions.spec.ts adds the missing-slider red
scenario, pointer adjustment, bracket synchronization and cancellation. Existing
mask/note/focus scenarios remain regression coverage. Build and focused checks,
then one fresh-context independent review; protected CI gates integration.
Test-only8e3014e on1c6d339 failed meaningfully on missing slider (expected1,
received0). The implemented control is an absolute contextual popover below the
active marker, counter-scaled to keep its physical size usable at any canvas
zoom. It does not participate in composite bounds. Its active node is raised
only in display props; no canonical geometry or persisted schema changes.
Native pointer/keyboard range controls and bracket keys share brush radius.

Production build and five region/mask/viewport cases PASS; diff check PASS.
Full regression suite and independent review pending. Human acceptance pending.
