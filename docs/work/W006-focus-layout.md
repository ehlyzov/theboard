# W006 — temporary focus layout

Status: review. Owner: TheBoard chat. Branch: feat/transient-focus-layout.
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
