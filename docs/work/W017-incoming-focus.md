# W017 — incoming and outgoing one-hop focus

Status: active. Owner: TheBoard chat, single writer. Branch: feat/incoming-focus.
Base: 3ca4a0d5f0ff995919b59ae90921495fc5164e49.
Source: owner request 2026-11-14: show blocks from which the focus block can be reached, as well as its destinations.

## Criteria before implementation

FOCUS-07: focused set contains the current screen and both endpoints of every direct incoming/outgoing transition. Show all such transitions with their existing direction/labels, including reciprocal and parallel paths. Hide two-hop/unrelated screens and transitions between neighbors that do not touch the focused screen. Sidebar emphasis matches the visible set. Docked and mask-linked notes for all visible screens remain visible.

FOCUS-05/06 remain: temporary compact layout, changing focus, editing notes, reload and exit preserve canonical nodes/edges/docks/routes/labels and the normal viewport; global manual and automatic modes. Tooltip/help must describe both directions. No archive schema changes or user board mutation.

Checks: synthetic mixed-direction graph, incoming-only focus, source switching, parallel/reciprocal edges, excluded neighbor-only paths, note ownership, export/reload equality, manual/automatic layout and production Pages. Existing expectations explicitly tied to outgoing-only behavior must change to the new requirement. Separate fresh-context read-only review of exact candidate; protected CI/Pages before publication.
