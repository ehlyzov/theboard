# W008 — contextual marker size slider

Status: done (bounded technical outcome). Owner: TheBoard chat. Branch: feat/contextual-marker-size.
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
Independent bounded review on8c2eaa76350dd7cea926abde705cc3de374fb561/base1c6d339
PASS: build and five region cases, pointer/native drag and keyboard boundaries,
25%/100%/400% physical control sizing (100x20px input), preserved old6% stroke
and subsequent16% stroke, unchanged composite/core measurements and canonical
node fields, Enter/Escape dismissal. Exported board.json before/active was
identical. No actionable W008 finding; the full suite was not rerun by reviewer.
Human acceptance pending.

The initial author full run had26PASS and one LAYOUT-01 import failure: semantic
edges existed but their rendered labels were absent. Cause not established;
no speculative product repair or assertion weakening was made. Five author
parallel reproductions and three independent repeats all PASS. The unchanged
source then passed all27 in required CI42521150330 and in the author's final
full execution gate (4.7s). This closes the execution gate, not the explanation
of the one initial observation; retain it if another trace reproduces the case.
No automatic retries were enabled.

[PR6](https://github.com/ehlyzov/theboard/pull/6) is the protected integration
record; [source CI](https://github.com/ehlyzov/theboard/actions/runs/42521150330/job/128854697213)
PASS on8c2eaa7. Final follow-up changes report/status only and retains reviewed
product/tests. Exact final-head protected CI remains mandatory before merge.
Next product scope remains W005 Markdown; no additional schema/storage change.
