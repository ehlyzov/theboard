# W013 — note-owned masks and screen-bound dock sizing

Status: active. Owner: TheBoard chat. Human acceptance pending.
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
Technical verdict NOT_RUN. Next: meaningful red checks, implementation, scoped
independent review, protected green CI and Pages publication.
