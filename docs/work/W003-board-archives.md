# W003 — local boards and portable archives

Status: active. Owner: TheBoard chat. Branch: `feat/board-archives`.
Source: the owner's delegated PlanItForMe request to prepare a local UFD board,
add import, transition labels, persistence as needed, keep materials local,
and preserve other boards. Later direct instructions require English repository
documentation and maximally declarative, agent-friendly data.

## Criteria

- ARCH-01: importing ZIP screenshots, labels, notes creates a separate board.
- ARCH-02: reload retains content, edited note, and edge label.
- ARCH-03: export/import restores data in a clean browser profile.
- ARCH-04: invalid ZIP leaves the current board untouched; other boards survive.

Test-first: `tests/archives.spec.ts`, original synthetic images only.
Test-only commit `60e14bf` recorded before implementation; meaningful early
FAIL: saved indicator absent while editor/server worked. After implementation,
build PASS and 5/5 browser tests PASS, including the four existing editor checks.
UFD-04's temporary-storage text assertion was updated because persistence is
now implemented; corrupt-file and object-preservation assertions were retained.

## Format and scope

ZIP `board.json` {version:1,title,nodes,edges}; images reference `assets/*`.
IndexedDB uses board IDs; imports always create a new ID. Declarative format
and standard-library CLI: [board format](../board-format.md).
No GitHub synchronization or offline application shell in this slice.
Real project materials stay outside this public repository.

Technical verdict: pending independent review. Human acceptance: pending.
Next: review the candidate and prepare the local requested board from updated
screenshots; do not label baseline v0.7 captures as updated UI.
