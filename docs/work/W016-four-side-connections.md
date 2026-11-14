# W016 — connect screens on all four sides

Status: done (bounded technical candidate; protected rollout recorded in PR15). Owner: TheBoard chat (single writer).
Branch: `feat/four-side-connections`. Base: ef07c2b.
Source: owner request, 2026-11-14: top/bottom connections and dragging between vertically stacked blocks.

## Criteria before implementation

- SIDE-01: every screen exposes top/bottom connection controls as well as existing left/right controls. Dragging bottom→top and top→bottom between stacked screens creates a directed edge, including a narrow gap.
- SIDE-02: click/release then click and keyboard activation can choose the same faces; cancel never creates an edge. No self-links.
- SIDE-03: chosen endpoints survive save/reload and ZIP export/import. Legacy left/right edges and existing dock active-face semantics remain valid; top/bottom controls use only the core-width span and the outward top/bottom dock surface.
- Preserve screen/note data, existing IDs/direction/labels and canonical geometry. No private board as fixture.

Checks: synthetic stacked two-screen fixture; actual mouse drag in both directions; click/keyboard creation; reload and ZIP endpoints. Existing editor, dock-face, archive, automatic/focus regressions. One fresh-context independent review of exact candidate SHA, followed only by targeted repair recheck if needed.

## Results and limitations

Test-only e925a5d on base ef07c2b: downward drag fails because bottom handle is absent; upward case interrupted and archive case not run. No expected outcome weakened.

Product candidate fe4303: independent focused15/16 exposed left-origin edge rendering failure; b7c26a4 repaired it with four visible source-capable faces and a noninteractive legacy target-left. Independent targeted12/12 plus explicit auto/focus/dock/Space/self-link and legacy-null checks PASS. Independent active-drag Escape reproduction FAIL: clearing click state alone allowed mouseup to create an edge.

Final product/test candidate addf02eb1599450988578e08d214472dec34a265 adds a canceled-gesture guard and resets it on connection start/end. Independent repair recheck: four-side+magnet10/10 PASS, separate original Escape reproduction1/1 PASS. Reports `/tmp/theboard-w016-review/{REVIEW,RECHECK}.md`; synthetic `vertical-connection.png` inspected by reviewer and author. No user board used.

Author build PASS. Final local full suite60/61: manual-focus immediate edit/reload read old text; unchanged focused manual+automatic recheck2/2 PASS. Prior b7 full57/60 hit three magnet coordinate races; independent stable-bounds magnet5/5 PASS and fixture now waits for settled coordinates without weakening docking/data checks. Final full run passes all five magnet cases. One early targeted run hit ENOSPC during browser close; not counted as behavior PASS. CI61 editor cases and Pages checks are final integration gates, tracked in PR15. Do not describe the local passing partition as one full green run.

Optional sourceHandle/targetHandle fields preserve chosen faces across ZIP roundtrip; old omitted fields still use right→left. Explicit faces also guide automatic/focus routing. Top/bottom hit controls use only the core-width column and outward dock boundaries. Help now explains any face and Escape.

Only this report/status follows the independently rechecked product bytes. PR15 records final protected checks, merge/deployment and public verification. Human acceptance pending. No new claims for touch, other browsers, or arbitrary overlapping/dense graphs. Next product work remains W005.

## Production hydration follow-up — PR16

PR15 merged593aee2; main43607709979 editor/Pages/deploy PASS. Public vertical gestures4/4 and hosted smoke2/2 passed, but explicit-face ZIP roundtrip intermittently retained semantic edge1 with SVG path0. Local production regression eb186e7 reproduced the failure. A settled diagnostic confirmed mode loose, measured nodes230x433, valid edgeLookup, and absent internal handleBounds on both screens. Cached dimensions alone did not establish usable connection geometry. Diagnostic callbacks and speculative port/initialization changes were removed; none were accepted fixes.

61429e054d1c05f5d304b79d3b2afb9b1369af76 refreshes DOM handle bounds after canonical screen ID/dimension changes, including the final hydrated state. Author production suite repeated3:9/9 PASS; editor/archive/focus/active-face regression17/17 PASS. Independent bounded production import3/3 and manual/automatic exact focus invariants2/2 PASS; report `/tmp/theboard-w016-import-review/RECHECK.md`. Full canonical nodes/edges remain identical except the deliberately edited note text. The production test waits for the saved indicator before reload; it does not promise unsaved edits survive closing the page.

Only report text follows these reviewed product/test bytes. PR16 records protected CI, deployment and renewed public checks for the final hydration fix. No private board or real account used.
