# W004 — screenshot region discussions

Status: active. Owner: TheBoard chat. Source: direct owner request for a mask-like
region selector, linked highlighted comments, additional replies, and completion
without removing comments from history. No new approval required.

REGION-01: draw a rectangular image region and attach a comment.
REGION-02: selecting it highlights its discussion and allows another comment.
REGION-03: complete a comment while retaining it visibly in history.
REGION-04: reload and archive roundtrip preserve regions, comments, and status.
Tests: tests/regions.spec.ts, before implementation. Non-goals: freehand masks,
remote identities, collaboration. Geometry is declarative normalized image
coordinates; stable region/comment IDs and timestamps are portable data.

## Scope reconciliation after owner steering

The current canonical list is [requirements](../product/requirements.md),
MASK-01..10, NOTE-01, VIEW-01/02, DOC-01..04, UI-01. The initial rectangle and
separate-comment description above is historical and superseded by freehand
brush masks linked to ordinary note nodes. Earlier texts require migration.
Markdown documents, deep-linked text fragments, 400% zoom, workspace restoration,
and the reported header layout repair are also requested. This task remains
active; none of the unreviewed current code is declared done.

Test-only states: 2af334c (original region semantics), 5e20cdd (400% zoom),
626fe41 (Markdown and viewport checks), edcf54f (latest mask-to-note semantics).
The first original region check failed meaningfully on missing selection UI.
A rectangle prototype later passed seven tests; that result is historical and
does not verify the replacement brush model. Current code is uncommitted and
not yet buildable while the model is being replaced. Independent review and CI
for the final brush/document candidate have not run. Human acceptance: pending.

Method deviation: rapidly arriving amendments were not reconciled into the
canonical docs immediately. They are now recorded explicitly, with supersession
and truthful implementation status. Do not reuse old green results to accept
the changed model. Complete focused checks, record a candidate, then request
one independent review plus targeted repair recheck before integration.

## Current bounded slice

The latest implementation uses freehand strokes with per-stroke normalized
radius and points, linked ordinary note IDs, and compatibility migration of
old comment texts into notes. Saved mask deletion retains notes and supports
Undo. Space/Alt modifier panning, viewport restoration, 400% zoom, header layout,
and portal labels above edge lines are included.

Local build PASS; eight current browser scenarios PASS. The earlier document
check failed on missing Create document UI; its draft is now explicitly outside
the executable suite under docs/work/drafts, for W005. It is not a green claim.
Do not delay the current bounded PlanItForMe blockers for W005.

## Latest interaction refinements

MASK-12 replaces per-screen controls with a common brush toolbar and B shortcut.
Bracket keys change radius; Ctrl/Cmd+Z undoes a stroke; Delete clears a draft;
Enter completes one mask; Escape cancels. Clicking a saved mask reveals its
trash icon. Hover highlights ordinary linked notes, with thin non-scaling visual
connectors. IMAGE-01 uses intrinsic image/card ratio without cropping pixels.

LAYOUT-01 auto-places labels outside node/label bounds, connects each label to
its edge, and permits direct label dragging. Portable node and edge geometry
is stored separately in `layout`; legacy inline node positions still import.
Focus mode shows current screen plus one-hop destinations, preserving full data.
Regression tests: tests/layout.spec.ts and tests/focus.spec.ts. These were added
following actual user screenshots; do not claim every refinement was strict TDD.

## Candidate preparation

Local current suite: 11 browser tests PASS, including separate layout export,
manual label dragging, image aspect ratios, focus, brush note links/delete Undo,
viewport400% reload and modifier panning. Additional brush multi-stroke/hover
regression added next. The visible runtime follows the production build rather
than Vite dependency optimization. User requests added during review are material
new deltas; earlier reviewer findings were repaired, but are not passed off as
independent acceptance of the later layout/keyboard/aspect changes.

DOCK-01 is recorded and remains a subsequent implementation requirement along
with Markdown W005; neither is silently marked complete by this candidate.
