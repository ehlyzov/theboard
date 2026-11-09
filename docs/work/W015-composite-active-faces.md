# W015 — route transitions through active composite faces

Status: done (bounded technical outcome; protected release record in PR14).
Owner: TheBoard chat (single writer).
Base: `35a6ba79cf69061549008bbcb5ebf3cda7e28460`.
Branch: `fix/composite-active-faces`. Human acceptance pending.
Source: owner screenshot/instruction21:50,2026-11-09.

## Accepted criteria before implementation

- DOCK-08: transition connection spans belong to the screen core. A docked
  note extends only the face opposite its screen attachment: a right note's
  right face, left note's left face, top note's top face, bottom note's bottom
  face. Top/bottom transition endpoints must not attach to a side note or
  empty corner. Mixed-side and stacked notes retain these exposed spans.
- DOCK-09: use these faces for automatic and temporary focus routes, incoming
  and outgoing transitions, RIGHT and DOWN. Manual left/right handles stay
  centered on the screen row, extending horizontally only through left/right
  docks. Preserve note content/docks/IDs, edge IDs/direction/labels, group
  dimensions, canonical focus/export geometry and annotation connectors.

Checks before behavior: synthetic four-screen, six-transition fixtures with
left/right/top/bottom docks; inspect actual rendered edge endpoint coordinates
against actual active core/note faces, including multiple ports. Check manual
handle row alignment and automatic/focus geometry. Preserve existing dock,
focus, layout, mask-connector regression outcomes. Separate fresh-context
read-only review of the exact candidate; green PR/main CI before publication.
No real/private board is used as a fixture.

Prior W014 release is complete: PR13 merged35a6ba7; main42677499194 all3 jobs
PASS; public smoke2/2 and exact index/allJS-CSS artifact equality PASS.

## Author checkpoint

Test-only9a383a9:8/8 meaningful failures. Top/bottom docks misplaced manual
handle centers; side docks allowed automatic endpoints outside the core span.
Traces retained `/tmp/theboard-w015-red`. No assertions/timeouts relaxed.

ELK now gets fixed measured ports for every screen, using the relevant exposed
core/note face rather than the entire composite rectangle. Stacked sides use
the outermost note. Existing padding bridges for annotation satellites remain.
Manual handles occupy only grid row2, so top/bottom notes do not shift them.

Initial targeted run13/14 exposed an intermittent existing child-coordinate
sync hazard after automatic direction/focus changes (hidden child's x offset
was1523px wrong). The solver already updates parent+children together; the
separate DOM sync now runs only in manual mode. It cannot overwrite an atomic
automatic result while controlled positions are changing. The old invariant
assertions remain; only diagnostic context was added to failure messages.
Two isolated old-case repeats passed before the guard; the final combined
automatic/docking/new-face run repeated twice PASS28/28 after it. Build PASS.
Full root, Pages, independent review and hosted gates follow.

Initial19ed3fa full root54/56: exact automatic focus reload and satellite
boundary checks failed. Independent16/17 also reproduced the exact reload
failure; base35a6ba7 focus/linked checks4/4 PASS. These are candidate regressions,
not weakened requirements. Client-rect/zoom arithmetic had introduced subpixel
drift in saved routes/labels. Active-face measurement now uses local offset
coordinates/sizes, including the core's visible1px outline.

Repair focused13/14 preserves exact focus geometry and RIGHT. Legacy MASK-15
DOWN compares against the entire group's transparent1px border, whereas DOCK-08
explicitly makes the actual bottom note's external border-box its active face.
Update that expected target to the real DOM note boundary, keeping the same
<1px precision and all satellite/canonical assertions. Independent reviewer
confirmed this target follows the new owner requirement; no threshold change.

## Final checkpoint

Repaired1bb2877da0cac9b5d78398c95fb1abb5180b3ec8: author build and full56/56
PASS; final Pages build and2/2 PASS. Initial independent FAIL19ed3fa is retained
at `/tmp/theboard-w015-review-artifacts/review-19ed3fa.md`. One targeted repair
recheck of immutable1bb2877: PASS14/14, exact canonical focus/reload equality
retained and<1px active-boundary checks preserved.

Independent synthetic right2-note and mixed2-per-side stacks:38/38 actual SVG
endpoints PASS across RIGHT/DOWN and focus; manual handles centered on screen
row. IDs, labels, docks and hidden child offsets preserved. Report
`/tmp/theboard-w015-review-artifacts/recheck-1bb2877.md`; proof
`recheck-right-stacked-down.png` and`recheck-mixed-stacked-down.png` in that folder.
Author inspected the synthetic right-stack view. No private/user board modified.

Only report/status changes follow the reviewed product/test bytes. PR14 records
the exact final head/base, protected checks, merge/main deployment and live
smoke/artifact equality. Those gates remain required before public delivery.
Other browser engines and arbitrary dense graphs are not established by these
fixtures. Human acceptance remains pending; next product work stays in queue.
