# W013 — note-owned masks and screen-bound dock sizing

Status: done (bounded technical outcome; protected rollout record in PR11). Owner: TheBoard chat. Human acceptance pending.
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
Technical verdict: PASS after targeted independent repairs/recheck.
Human acceptance remains pending; final rollout is recorded in PR11.

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

## Independent findings and targeted repairs

Fresh-context Sol/high review ofc9f6299: FAIL on two reproducible requirements,
while the independent build and15 affected scenarios PASS. Report:
`/tmp/theboard-mask-review-c9f6299/report/REVIEW.md`.

1. A note docked to a hidden unrelated parent disappeared from focus, dropping
   one selected link. Regression7f7fb71 fails meaningfully on the missing note.
   Focus now includes it as a standalone temporary solver satellite, retaining
   canonical dock data and rendering the real demagnetize action. Tests compare
   the entire exported board before/during/after focus in manual and automatic
   modes; the unrelated screen remains hidden.
2. Composing an extra note after deleting another owner used the form's stale
   region snapshot, resurrected a deleted ID and broke immediate export.
   Regression51fe019 fails on the export alert. Attachment now reads the current
   region inside its atomic node update and merges only its surviving owners.

Repair build and13 focused lifecycle/connection/focus/automatic scenarios PASS.
No assertion/timeout was weakened. Expanded final suite and independent targeted
recheck follow. The original FAIL remains part of the evidence, not a PASS.


## Final technical checkpoint

Repaired candidate `b224c17ddbb7c1c87f5bbb8b6f5c14df89bed598`: author build,
full45/45 and Pages2/2 PASS. Source
[CI42669457961](https://github.com/ehlyzov/theboard/actions/runs/42669457961)
editor-checks and pages-checks PASS; deployment skipped on PR as intended.

One independent targeted recheck of exactb224c17: PASS,9/9 requested lifecycle/
connector cases. The original six-link mixed fixture shows6 active paths and6
notes with only1 screen in focus; the cross-parent note keeps its real
"Размагнитить заметку" action. Entire before/during/after board.json deep-equals;
the note returns to its parent's left slot on exit. Actual rendered endpoints
and shortest lengths pass with endpoint error0px. The original stale-composition
sequence now exports immediately without alerts, retains6 valid surviving
associations and never restores the deleted ID. No remaining blocker in the
repaired scenarios. Original FAIL evidence is retained separately.

Report: `/tmp/theboard-mask-recheck-b224c17/report/RECHECK.md`; synthetic proof:
`report/repaired-six-links-focus.png`. No private/user board was opened or
changed. Earlier unaffected independent geometry/migration observations remain
valid; no second broad review was run. Other browser engines and arbitrary dense
routing are not established by these examples.

This final update changes reports/status only; product/test bytes remain the
reviewedb224c17. [PR11](https://github.com/ehlyzov/theboard/pull/11) records the
exact final head, up-to-date protected checks, merge/main deployment and live
public smoke. Those gates must finish before delivery. Next product work stays
in the existing queue; human functional acceptance is not implied.
