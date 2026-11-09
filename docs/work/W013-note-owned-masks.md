# W013 — note-owned masks and screen-bound dock sizing

Status: review. Owner: TheBoard chat. Human acceptance pending.
Base: `a36746c79e1f66a8d217043e0fad5ab31edd9e4a` (W012 icon candidate).
Branch: `fix/demagnetize-icon`; one writer, shared publication with W012.
Source: direct owner requests/screenshots, 2026-11-09.

## Accepted criteria before implementation

- MASK-16: a persisted mask has at least one existing ordinary note. Drawing and
  note composition remain temporary until attachment; cancel never saves a mask.
  Deleting a note removes its links everywhere and removes masks left without
  notes. A mask shared by several notes remains for the other notes.
- MASK-17: remove separate mask deletion and its Undo action. Note deletion is
  the way to remove its final mask association. Close stale selection/composition
  after deletion or board replacement; no stale chooser can create broken links.
- MASK-18: load/import old empty masks as cleaned data; convert legacy comments
  to ordinary notes before deciding whether their masks are empty. Preserve
  text/status/timestamps. Invalid imported references still fail validation.
  Export/reload must not resurrect orphan masks or lose surviving note history.
- DOCK-06: top/bottom notes stretch only across the screen core, excluding any
  left/right notes. Align their edges with the core. Preserve IDs, content,
  docks and outer routing; automatic/focus layout measures the resulting group.

Tests precede behavior: lifecycle via note trash and keyboard Delete, shared
mask survival, migration/legacy history, draft/chooser/replacement cleanup and
mixed-side portrait/landscape composites. Prior independent mask deletion/Undo
expectations are explicitly superseded by MASK-17, not weakened for a green run.
Existing archive validation, pending preview, docking and focus outcomes remain.
Technical verdict: author local PASS. Next: scoped independent review and
protected green CI/Pages publication.

## Additional accepted presentation requirements

- MASK-19: selecting a mask emphasizes all its note links above the cards.
  Docked-note links take the shortest orthogonal approach to the nearest face;
  free-note links go straight to the nearest boundary point. Geometry follows
  real screen/image/note bounds under pan, zoom, docking and transient focus.
- NOTE-03: remove the completion checkbox, its text and the completion-changing
  code from note UI. New notes do not initialize completion state. Old archive
  metadata is retained read-only for compatibility; no history is discarded.

Checkpoint: six lifecycle/mixed-side cases PASS after meaningful red at068dfeb:
independent mask deletion was present and top note was414px wider than the core.
The following connection/status tests precede their implementation.


## Implementation and author evidence

- Persisted masks are normalized after legacy comment migration. Local load,
  save and export clean empty masks; archive import still rejects invalid note
  references before migration. Legacy comment text/status/timestamps become
  ordinary notes before empty-mask pruning.
- Both note-trash and React Flow keyboard deletion use one cleanup helper.
  Shared masks retain surviving note IDs; final-note deletion removes masks on
  every source. Draft linking guards stale note/mask IDs and closes stale UI.
  Saved mask deletion, its Undo state and controls are removed.
- Top/bottom slots occupy the screen core column. Existing DOM-based automatic
  and focus measurement reads the resulting group; no new stored geometry or
  routing schema. Derived connection paths use measured image/note rectangles,
  not approximate card offsets, and redraw after resize, pan and zoom. Active
  paths have a non-scaling halo and draw above nodes without intercepting input.
- Completion control/text/updates and new-note status creation are removed.
  Historical archive metadata remains read-only for compatibility.

Meaningful red:068dfeb exposed the obsolete mask trash and a414px excess dock
width. e6aaf44 connector test failed because none of the five selected links
had the required active overlay. Initial new core-width test sampled separate
frames during animated focus fitting; one full run yielded41/42. The test now
reads all geometry in one frame and polls the same <2px criterion, without
weakening precision. No product geometry change was needed for that timing.

`npm run build` PASS; full suite on dedicated4362 using the ignored W011 config
PASS42/42; `npm run build:pages && npm run test:pages` PASS2/2. The former
independent-mask deletion/Undo test is superseded by the direct MASK-17 request;
replacement now checks stale selection/composition and recovery, and dedicated
lifecycle cases check both deletion paths, shared masks, legacy/local migration,
archive roundtrip and invalid-reference rejection. All other regression
outcomes remain. Independent expanded-scope review and hosted rollout pending.
