# W006 — temporary focus layout

Status: done (bounded technical outcome). Owner: TheBoard chat. Branch: feat/transient-focus-layout.
Base:3200860bcc38cf5d0ebf0962eaa78b6f14dc9966. Human acceptance: pending.

Source: direct owner instruction,2026-11-08: arrange related screens close
together in focus, do not save this arrangement, and restore all blocks to
their pre-focus positions when focus ends. This supersedes using the global
positions merely to frame focus. Scope: one-hop focus, measured composites,
routes/labels, linked ordinary notes, save/export/reload separation and stale
async cancellation. No new storage schema or global routing algorithm.

FOCUS-04: automatic temporary placement of the current screen, outgoing
destinations, docked notes and visible linked notes in both global manual and
automatic modes. No manual position/label editing of this computed view.
FOCUS-05: entering, changing source and leaving focus never commits temporary
node/edge/label coordinates to the board or archive. Reload while focused uses
the canonical board and recomputes the view. Ordinary content edits still save;
explicit global layout controls retain their existing meaning.
FOCUS-06: leaving focus restores canonical geometry and the prior normal-view
viewport. Late layout results cannot move the unfocused board or another source.

Checks before implementation: tests/focus-layout.spec.ts covers distant roots,
separate/docked notes, manual routes/labels, archive equality during focus,
source switching, editing an ordinary note, reload and exit. Both global modes
are covered. Run the new test on base first, then affected focus/auto/mask tests,
build, full suite and one fresh-context independent review. Do not touch the
owner's Brave session or commit private boards.

## Test-first and implementation checkpoint

Test-onlyda69ca2 on3200860: manual scenario FAIL on missing temporary routed
edges; automatic scenario exposed subpixel dock-cache noise after reload.
The subsequent test adds a real visible-position delta assertion for both modes.
It normalizes only exported node-coordinate cache values to0.001px; routes,
labels, engine/settings and docking remain exact. This is below the existing
0.2px DOM-cache update threshold and detects any actual temporary placement.
No expected restoration or data-preservation outcome was removed.

The geometry overlay is keyed by focus source, visible semantic content,
measured sizes and direction, with stale promises discarded on source/exit.
Canonical nodes/edges remain the sole input to save/export. Node/label dragging
is disabled only for the computed focus view; note editing, masks and panning
remain. Mask connectors account for the transient composite offset. Normal
viewport coordinates are retained through focus/reload; temporary viewport
animation coordinates are not written to workspace storage. Existing explicit
global layout actions retain their persistent meaning.

Six affected focus/automatic scenarios PASS; production build PASS. One old
automatic test now waits for the global calculation status to clear: a temporary
route change no longer means that the requested global DOWN calculation has
finished. The DOWN engine and hidden dock-coordinate assertions are unchanged.
Full suite25/25 PASS after workspace-coordinate assertions were added; diff
check PASS. Independent review pending. Human acceptance pending.

## Compact-group framing correction

Own local private-board viewing found that the old readable-source fallback
could leave destinations outside the viewport even after positions compacted.
The synthetic fixture now includes a third outgoing destination and asserts all
focused screen bounds fit the canvas. Test-only4d714d7 on0de4f94 FAIL in both
global modes on that viewport assertion. Focus-result fitting now frames the
whole compact root group (including visible linked notes), while clicking the
current sidebar item still explicitly recenters that screen. The normal-view
viewport and canonical geometry remain unchanged.

## CI remount measurement repair

Required CI42518958970 on4b701db failed AUTO-01: a hidden note's vertical
relative offset differed by30px, while24 other tests passed. A remounted
RegionImage initialized to ratio1 before its load callback, measuring380px
height instead of the known portrait350px. The component now derives ratio
from already decoded imageSize when available, retaining load fallback for
legacy unknown sizes. No portable schema changes.

Test-only9366d6d initially passed because its window load interception did not
delay React's image listener. The deterministic driver now withholds image
load listeners (upload decoding still works). In an isolated4b701db checkout
the corrected assertion FAIL: ratios[1,1] instead of[0.6,1.67]. With the repair,
all five affected layout/automatic checks PASS. Full26/26 had passed before
this driver correction; those five rerun checks verify the corrected driver.
Independent targeted repair check and exact-head CI pending. No assertions or
required precision thresholds in AUTO-01 were weakened.

## Final independent results

Independent initial review0de4f94/base3200860 reproduced build and25/25 tests
PASS. Final framing4b701db build and six affected tests PASS. Additional
synthetic checks cover four-side docks, loose-note editing, mask connector
endpoints, manual gesture isolation, source changes, whole-group framing and
normal viewport/root restoration. A forced600ms ELK chunk delay followed by
A→B showed only the new B neighborhood; exiting restored original coordinates.
No remaining product finding in that scope.

The CI remount repaira61c145 passed five independent affected checks, including
the original hidden-note DOWN offset assertions. Independent build then caught
TS7006 in the new test driver's untyped arguments. Typed-only follow-up
c812046eecd6c79dea7bd23c2001e144978d2327 independently passed build, diff check
and the delayed-load test. The corrected driver independently fails on old4b
with ratios[1,1]. That finding is resolved. No additional full audit was run.
Local full26/26 PASS preceded the corrected driver; five affected cases were
rerun after the correction, then build and the new case after typing. Required
final-head CI still gates protected PR integration.

The separate local real-board QA copy demonstrated five focused screens and
exact restoration of all49 original screen positions. That browser session
also had an intermittent storage error and later an absent test board under
very low host disk space. Its private archive restored the QA copy; subsequent
save/reload succeeded. Cause was not established, and synthetic PASS does not
close that environmental observation. Private source data and paths remain
outside the public repository; the owner's working browser was not operated.

Technical PASS for this bounded focus change; human functional acceptance
pending. [PR4](https://github.com/ehlyzov/theboard/pull/4) is the integration
record. Next: W005 Markdown; GitHub exchange/offline startup remain pending.
This final follow-up changes reports/status and descriptive format docs only,
retaining the reviewed product/test source.
