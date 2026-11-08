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

## Independent review and publication

Full read-only review: `archive_review`, GPT-6.1 Sol High, fresh context,
candidate `b61b091994a93d66efec167acda9048b174f05a0`. Build and five browser
checks PASS. English documentation and D1/D2 approved, D3/D4 proposed were
verified against the base.

Two roundtrip findings were repaired: limit editable/exported labels and
other exported fields to import limits; support safe Unicode/space asset paths.
The storage-load failure message now correctly says editing is disabled rather
than suggesting an unavailable export. Targeted recheck PASS at `c9a437c`
(product source identical to `434569a`): 501 typed label characters become 500;
export/import succeeds with two decoded images; Unicode asset import creates a
new ID. Export rejects 501 nodes, 2001 edges, overlong title/node title/note/
label and 190 MB data, while a valid note archive exports. Failure-message
source verified; simulated storage-failure runtime check NOT_RUN.

Technical verdict: PASS within these checks. Human acceptance: pending.
Author CLI pack/unpack roundtrip and all local Markdown links PASS.
No Cyrillic prose remains in repository Markdown. Russian UI strings, original
synthetic fixture names, and user-facing cross-project handoff retain Russian.
[PR #2](https://github.com/ehlyzov/theboard/pull/2) contains only generic code,
synthetic tests and English docs, not another project's screenshots or audit.
The local requested board awaits its producer's updated machine-readable UFD.
