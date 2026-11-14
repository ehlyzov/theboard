# W017 — incoming and outgoing one-hop focus

Status: done (implementation and independent technical checks; protected rollout recorded in the branch PR). Owner: TheBoard chat, single writer. Branch: feat/incoming-focus.
Base: 3ca4a0d5f0ff995919b59ae90921495fc5164e49.
Source: owner request 2026-11-14: show blocks from which the focus block can be reached, as well as its destinations.

## Criteria before implementation

FOCUS-07: focused set contains the current screen and both endpoints of every direct incoming/outgoing transition. Show all such transitions with their existing direction/labels, including reciprocal and parallel paths. Hide two-hop/unrelated screens and transitions between neighbors that do not touch the focused screen. Sidebar emphasis matches the visible set. Docked and mask-linked notes for all visible screens remain visible.

FOCUS-05/06 remain: temporary compact layout, changing focus, editing notes, reload and exit preserve canonical nodes/edges/docks/routes/labels and the normal viewport; global manual and automatic modes. Tooltip/help must describe both directions. No archive schema changes or user board mutation.

Checks: synthetic mixed-direction graph, incoming-only focus, source switching, parallel/reciprocal edges, excluded neighbor-only paths, note ownership, export/reload equality, manual/automatic layout and production Pages. Existing expectations explicitly tied to outgoing-only behavior must change to the new requirement. Separate fresh-context read-only review of exact candidate; protected CI/Pages before publication.

## Implementation and test-first evidence

Test-only commit `88246d6` on the base above: the manual FOCUS-07 scenario failed meaningfully (expected four incident transitions, observed two outgoing transitions). The automatic scenario initially hit a test setup error: the checkbox opens a confirmation before changing state. The test now clicks and confirms explicitly.

Runtime candidate `ec69bfaf562f210bc0cacd78a3e52cc4f967e8f0` uses one incident-edge set for visibility and temporary layout, includes both endpoints, and updates the tooltip. Existing note collection and canonical persistence remain unchanged. Requirements and board-format documentation now describe direct predecessors and destinations.

Existing outgoing-only count/title expectations were updated. The focus-layout fixture adds a two-hop predecessor so its original compaction threshold remains meaningful when the former upstream predecessor becomes visible. The note-edit/reload scenario waits for the exported committed text before reloading, retaining its post-reload content assertion. Composite-face checks now exercise all six incoming/outgoing paths in focus.

Final test candidate `279b9cdf4b94b1e96146b18a6084b4793bdd4104` changes only the remaining linked-note fixture expectation: focus C explicitly contains `a,b,c,d,f` and `ac,bc,cd,cf`, excluding E. Existing note-distance and canonical-layout equality checks remain.

## Observed checks

Environment: macOS, Node25.3.0, npm11.7.0, Playwright1.65.0. Synthetic boards only; no private board or owner browser accessed.

| Check | Observed result |
| --- | --- |
| Author affected focus, incoming-focus, focus-layout and composite-faces tests | PASS14/14; `/tmp/theboard-w017-focused2.log` |
| Author `npm run build:pages` and `npm run test:pages -- --workers=1` | PASS build and5/5, including manual/automatic incoming-focus production scenarios; `/tmp/theboard-w017-build.log`, `/tmp/theboard-w017-pages.log` |
| Author complete local63 at ec69bfa |61 PASS,2 FAIL on old linked-note count3 versus new direct-neighbor count5; `/tmp/theboard-w017-full-recheck.log` |
| Author final linked-note delta, both RIGHT/DOWN | PASS2/2; `/tmp/theboard-w017-linked-notes.log` |
| Fresh-context independent review at ec69bfa | PASS source review, affected14/14, separate production build and incoming-focus2/2; `/tmp/theboard-w017-review/review.md` |
| Independent synthetic incoming dock and mask-linked foreign-owned note | PASS visibility, screenshot, reload and canonical ZIP export; `/tmp/theboard-w017-review/incoming-focus.png` |
| Independent targeted linked-note recheck at279b9cd | PASS2/2; `/tmp/theboard-w017-review/linked-notes-recheck.log` |

Initial author/reviewer runs were BLOCKED by ENOSPC, not product failures. After stopping both runs, only a reproducible downloaded Chromium runtime cache was removed; owner data and browser profiles were untouched. Unchanged runtime passed the subsequent checks above. No complete local63/63 claim is made: the final-head full-suite gate runs in protected CI.

The independent reviewer found no actionable defect. It confirmed original directions/labels, parallel/reciprocal edges, exclusion of nonincident neighbor edges, sidebar emphasis, incoming notes, source switching, canonical equality, viewport restoration and RIGHT/DOWN exposed endpoints. Reviewed production JS SHA256: `7f8ca835989841b51c899aa852615e2e0c5daa6690ab2267d2555969c604e1e8`; CSS: `55fa82db58f3835a99bd01aa6c4073b6facfac530c7dc797e59301bb7a4246b3`.

## Rollout, limitations and next step

Final-head PR checks, protected merge, main deployment and public Pages smoke/artifact comparison are recorded in the GitHub PR for `feat/incoming-focus`. Report-only follow-ups retain the exact runtime review above. Publication requires green editor and Pages jobs; no bypass. Human functional acceptance remains pending. Next product task: W005.
