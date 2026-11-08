# W004 — masks, ordinary notes and composite layout

Current result: the full editor integrates measured ELK layout, automatic/manual
modes with reset confirmation, four-side ordinary-note docking, focus navigation,
mask-to-note links, eight colors, workspace persistence and ZIP replacement with
recovery. Latest UI refinements put the marker in each screen header and all
navigation hints in the bottom status area. Earlier checkpoints below are
historical and do not override this summary or the canonical requirements.

Verification: full independent review277edbc reproduced20/20 tests and private
data/asset equality. Its focus finding was repaired and independently rechecked
at1870b78. Hidden dock-coordinate fidelity was independently checked at68a08d;
manual SVG handles and navigation test synchronization passed targeted review
at4102e4a, whose required CI passed. Latest source builds and23/23 browser tests
PASS locally; contextual marker/footer recheck and final-head CI remain pending.
The new scenario was red in test-only45bb609 before implementation.

Human acceptance: positive layout feedback and source-operator private-board
confirmation; full functional acceptance remains pending. Next scope is W005
Markdown nodes/fragment annotations. GitHub synchronization, offline startup,
and fixed-node obstacle routing remain separate; proper crossings remain.


Status: review. Owner: TheBoard chat. Source: direct owner request for a mask-like
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

## Layout research requested by the owner

LAYOUT-02 produced [a source-backed algorithm proposal](../research/board-layout.md)
and an isolated elkjs 0.12.1 probe. Three synthetic fixtures (6/5, 8/14 and 32/76
nodes/edges) have zero measured box overlaps, route-obstacle hits and coincident
segments. The dense fixture still has 160 proper segment crossings and a large
bounding box: this is feasibility evidence, not good-layout acceptance.

Research files and README link only; no product dependencies or live board data
changed. The proposed persistence extensions and libavoid browser integration
are not implemented. Keep DOCK-01 and ROUTE-01 open; use measured composite
bounds, global placement and actual route geometry in the next bounded slice.

## PlanItForMe layout example

The owner requested an executable example on local PlanItForMe data, followed by
LAYOUT-03 (dashed label-to-arrow leaders visible only on label hover). Scope:
generate a separate interactive preview with measured screen+note composites,
ELK routes and measured labels, preserve all source content/IDs, and export its
declarative geometry. Source board/files and the owner's active board stay intact.
The example is not a replacement for the main editor or completion of DOCK-01.

Observable checks: all input nodes/edges/content remain; each configured note
fills the screen width below it; route geometry is actually rendered; inspect
overlaps/coincidences and report remaining crossings; hover reveals only the
matching dashed leader; support pan/zoom through 400%; no external network
dependency in the generated preview. Private data and previews remain local.

## Approved main-editor integration

The owner prefers the demonstrated layout and explicitly requested integration
without losing editor functionality. AUTO-01/02 require an on/off automatic
mode, manual placement while off, and a reset warning before enabling. Cancel
must preserve manual geometry. Existing masks, note editing/colors, focus,
archives, viewport and image ratios remain regression obligations. Test-only
candidate adds tests/auto-layout.spec.ts; existing DOCK-01 test remains a required
red-to-green check, not an exclusion from the final integration suite.

ARCH-05 is a minimal independently verifiable step: replacement from ZIP at the
same URL with a recovery board. Two focused archive checks PASS on0077d42;
source operator instructions are recorded in the private handoff. The initial
red run waited on the missing input; its trace artifacts were disrupted by an
overlapping later run, so only the console observation is usable. Subsequent
runs must not share a mutable result directory concurrently.

## Integrated candidate preparation

Four-side ordinary-note docking now renders inside screen composites while
retaining the same note nodes/IDs. Automatic mode uses measured ELK geometry,
actual route vertices and labels; manual mode keeps position/label editing.
AUTO-02 uses a native modal reset warning. Focus has a synchronized sidebar
switch and clear current/destination emphasis. Source operator independently
confirmed ARCH-05 replacement of the accepted local UFD on its original URL;
private counts and paths stay in its handoff.

Local full suite:20/20 PASS before final provenance/modal refinement. The five
affected automatic/docking checks PASS after that refinement. Independent main
integration review still pending. The initial auto test's `check()` driver was
corrected to `click()`: activation intentionally waits for modal confirmation;
the expected checked/unchecked/cancel outcomes were preserved. The new palette
scenario corrected a case-sensitive Russian color label to the actual lowercase
label. Neither correction weakens the required behavior. A transient missing
edge under parallel checks led to explicitly refreshing React Flow node/handle
internals after layout; the subsequent full suite passed.

Remaining boundaries: W005 Markdown, GitHub synchronization, offline startup
and libavoid fixed-node routing are not delivered by this integration. Private
PlanItForMe data must never enter this public repository.

## Independent integration review and focused viewport repair

Fresh-context independent review of277edbc against379d48e reproduced build and
20/20 tests PASS in an isolated checkout. It additionally checked actual graph
content/asset equality, measured composites, both routing directions, delayed
stale-result cancellation, warning cancellation/Escape, manual node/label moves,
mask keyboard gestures and deletion of a screen with four attached notes.
No data-preservation or routing-obstacle blocker was found. Proper crossings
remain; no global optimality or zero-crossing claim is made.

One P2 was independently reproduced: a widely spaced focus neighborhood fits at
about11%, and clicking the current sidebar entry does not recenter it. The repair
changes viewport only: current-entry clicks always center that card; a focus
overview below50% frames the source instead, retaining all destination elements
and their sidebar navigation. Test-only3d846c1 failed on the missing recenter;
the new focused tests pass with the repair. The test waits300ms for known
150/250ms viewport transitions before judging framing. Independent targeted
repair recheck is pending; no second full review is required.

The dependency's upstream license text is served locally and linked from
THIRD_PARTY_NOTICES.md. Private real-data observations and screenshots remain in
the private handoff; the source operator confirmed49 nested note pairs and
reload/export/reimport on the original local board URL.

## Contextual marker and unobstructed hints

The owner's latest correction supersedes common-toolbar brush placement:
each screen header owns its marker pictogram beside deletion. B targets the
hovered/selected screen (or the sole screen); bracket radius and mask semantics
remain. Other markers are disabled while that screen owns the unfinished draft,
so switching cannot silently discard strokes. Navigation instructions move into
the bottom status area, outside both editor and standalone-example canvases.

Test-only45bb609 on4102e4a failed meaningfully because the brush remained in the
common toolbar. The added scenario checks contextual activation, another screen
being locked, cancellation, B on a hovered screen, and footer/canvas separation.
Earlier common-toolbar descriptions in this card are historical.
