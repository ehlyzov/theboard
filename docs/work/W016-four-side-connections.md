# W016 — connect screens on all four sides

Status: active. Owner: TheBoard chat (single writer).
Branch: `feat/four-side-connections`. Base: ef07c2b.
Source: owner request, 2026-11-14: top/bottom connections and dragging between vertically stacked blocks.

## Criteria before implementation

- SIDE-01: every screen exposes top/bottom connection controls as well as existing left/right controls. Dragging bottom→top and top→bottom between stacked screens creates a directed edge, including a narrow gap.
- SIDE-02: click/release then click and keyboard activation can choose the same faces; cancel never creates an edge. No self-links.
- SIDE-03: chosen endpoints survive save/reload and ZIP export/import. Legacy left/right edges and existing dock active-face semantics remain valid; top/bottom controls use only the core-width span and the outward top/bottom dock surface.
- Preserve screen/note data, existing IDs/direction/labels and canonical geometry. No private board as fixture.

Checks: synthetic stacked two-screen fixture; actual mouse drag in both directions; click/keyboard creation; reload and ZIP endpoints. Existing editor, dock-face, archive, automatic/focus regressions. One fresh-context independent review of exact candidate SHA, followed only by targeted repair recheck if needed.
