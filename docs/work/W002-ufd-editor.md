# W002 — first UFD editor

Status: done. Owner: TheBoard chat. Branch: `feat/ufd-editor`.
Base: `ebceb0308278646d5bd9ab5e401b9777df0fd581`.
This card records the historical W002 scope/results; W003 extends storage.

## Goal and sources

Assemble flows from uploaded named screenshots, directed arrows, and notes.
Sources: D1/D2 in the [MVP brief](../product/mvp-brief.md), and the owner's
instruction to begin work. W001 was complete; no new behavior decision was needed.

Scope: PNG/JPEG/WebP uploads, titles, placement, arrows, notes, object/edge deletion,
canvas navigation, understandable file errors. Non-goals: persistence, offline
restart, archives, GitHub, collaboration. Those remained MVP obligations. W002
explicitly displayed that data existed only in the current tab.

Implementation: React + TypeScript + Vite + React Flow, static build, no data
server. Checks: Playwright/Chromium. No external service or paid hosting required.

## Criteria and checks before implementation

| ID | Expected behavior | Check |
| --- | --- | --- |
| UFD-01 | Three PNGs display, titles are editable, screens move | `tests/editor.spec.ts` UFD-01 |
| UFD-02 | Directed connection follows moved screens; deleting a screen removes its arrow | `tests/editor.spec.ts` UFD-02 |
| UFD-03 | Create, edit, delete a note | `tests/editor.spec.ts` UFD-03 |
| UFD-04 | Corrupt image reports an error without damaging existing objects; storage limit visible | `tests/editor.spec.ts` UFD-04 |

Three images are a test example, not a product limit. Fixtures are original
synthetic images, not another project's screenshots.

## Execution

Test-only commit: `3f372c04230cd72b4b54d088d82aa2320d4d6bc8`.
`npm test -- --timeout=5000`: **4 FAIL** on the reachable empty page with Vite
and Chromium running. UFD-01/02/04 lacked upload UI; UFD-03 lacked note creation.
This was missing behavior, not an environment failure.

After implementation: build PASS, tests **4 PASS** with unchanged assertions.
Node/Vite types were added to TypeScript configuration. package-lock.json pins
the dependency graph.

Author browser check: three synthetic screens, two arrows, one note, fit view.
No Chromium pageerror. At 390px document width did not overflow. Desktop
1440×1000 and mobile 390×844 captures were inspected; ignored local artifacts
under `output/playwright/`. This did not test all touch gestures or other browsers.

Author environment: Node 25.3.0, npm 11.7.0, Playwright 1.65.0 Chromium.
CI uses Node 24 and the same browser tests. The builder warns about library
`use client` directives; this fully client-side app built and passed browser checks.

## Independent review

Technical verdict: **PASS**. Human acceptance: **pending**.
Reviewer `editor_review`, GPT-6.1 Sol High, fresh context, read-only.
Full-review candidate: `628b7e22699a2328b1ec27933f35f9c5ec17f669`.

- Build PASS, tests 4/4 PASS (UFD-01..04).
- Replayed the test-only archive on isolated port 4174: four meaningful FAIL.
  Test diff to candidate was empty; expected behavior was not weakened.
- Real connector dragging creates arrows; selecting the midpoint and Delete
  removes only the edge. Enter/Space connects; Escape cancels; Backspace edits titles.
- Keyboard screen deletion removes its edge and preserves the note.
- PNG/JPEG/WebP decode; corrupt PNG and SVG are rejected while five existing
  screens, an edge, and note text remain intact.
- No pageerror or external network requests; images are data URLs. Desktop/mobile
  checked, no 390px overflow, temporary-storage warning visible.

No blockers. One cosmetic repair addressed favicon 404 and an internal W002
footer label. Targeted recheck PASS on
`4fb88b05ecf99094f12b4d8a0741384c6c44ff30`: footer THEBOARD PREVIEW, inline favicon,
console errors/warnings=0, pageErrors=[]. Behavior, tests, CSS, dependencies did
not change; reviewer confirmed applicability of the earlier functional PASS.

Reviewer environment: Node 25.3.0, npm 11.7.0, Playwright 1.65.0; additional
interactive checks used Chromium 155.0.8059.40. Local evidence:
`output/playwright/review-red.log`, `review-drag.png`, `review-mobile.png`,
`review-cli/`, `review-cosmetic-cli/`. Other browsers, touch, and excluded
storage functions: NOT_RUN.

## CI and integration

[PR #1](https://github.com/ehlyzov/theboard/pull/1).
[First candidate CI](https://github.com/ehlyzov/theboard/actions/runs/42501134314)
passed npm ci, build, browser install, four tests, report upload. Latest PR SHA
receives its own required editor-checks before merge. The post-review commit
contained only reports, status, and ignored local browser logs; its SHA was not
presented as the original product candidate.

Main protection was configured/read through GitHub API: required editor-checks,
strict up-to-date base, PR, resolved conversations, administrator enforcement;
force pushes/deletion disabled. No mandatory human code-review approvals.
Agent technical review and human functional acceptance are different facts.
Server bypass was not tested with a deliberately malicious attempt.

## Pilot result and next step

First runnable slice complete. Zero additional owner questions for D1/D2.
One independent review, one cosmetic repair, one targeted recheck. Test-first
confirmed by historical execution. Tool cost unknown. No comparative claim of
reduced defects. Next: W003 browser persistence; GitHub, archives, and offline
startup remain in the MVP scope.
