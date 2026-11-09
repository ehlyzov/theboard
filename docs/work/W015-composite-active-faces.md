# W015 — route transitions through active composite faces

Status: active. Owner: TheBoard chat (single writer).
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
