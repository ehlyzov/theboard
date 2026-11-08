# W006 — temporary focus layout

Status: active. Owner: TheBoard chat. Branch: feat/transient-focus-layout.
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

Technical verdict: NOT_RUN. Next: record test-first observation, implement a
render-only geometry overlay, then run checks and independent review.
