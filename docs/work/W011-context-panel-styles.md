# W011 — consistent annotation panel and direct magnetic docking

Status: done (bounded technical outcome; rollout evidence in PR10). Owner: TheBoard chat. Human acceptance: pending.
Base: `434f363aae1745cbc0fe09ce9cee26d590f23830`.
Branch: `fix/context-panel-styles`.
Source: owner screenshots, 2026-11-09, showing mismatched native selects and
crowded labels/buttons in both the mask-to-note and note-docking panels.

## Observable criteria before implementation

- UI-05: the mask-to-note panel uses the application's font, neutral/purple colors, rounded
  fields, inset chevrons and visible keyboard focus. Labels sit above their
  fields; actions are spaced and visually distinguish primary, secondary and
  disabled states.
- UI-06: the mask-to-note panel fits their available width, including long note/screen
  choices. The mask panel wraps actions on a narrow viewport. Keep its native
  select semantics and all existing accessible names/keyboard operation.
- UI-07: linking an existing note, creating a linked note, cancellation and
  docking/undocking still work. No stored data, schema or layout behavior changes.

Cosmetic change: the owner's screenshots are the pre-change visual evidence;
no artificial red or new implementation-mirroring tests. Verify synthetic
panels visually in a clean browser, including keyboard focus and narrow width;
run the existing annotation/docking regression cases. Independent fresh-context
review follows the exact candidate. Existing hosted checks and main deployment
must be green before delivery; record final rollout evidence in the PR.
Technical verdict: PASS in the observed scope. Human acceptance pending.

## Accepted scope update before magnetic docking implementation

The owner then explicitly replaced the docking picker with a magnet icon:
press/hold/drag to a screen side, or click/release then click a screen side.
The old docking form is removed, not restyled. Existing docking persistence,
full-side sizing, outward edge routing and detach behavior remain obligations.

- DOCK-02: magnet drag/release attaches to the highlighted target side, all four
  sides; clicking the magnet arms the same targets for a subsequent click.
- DOCK-03: targets identify screen and side, support keyboard activation and
  remain usable at board zoom. Escape/cancel or an invalid drag changes no
  board data or node positions. No duplicate notes or implicit navigation edges.
- DOCK-04: magnet on an attached note detaches it, preserving content and color;
  stored dock fields and archive representation remain unchanged.

New gesture checks precede behavior. Existing docking/mask regression setup is
adapted from the removed dropdowns to side targets without removing assertions.

## Implementation and author verification

`850f278` meaningful red: the new drag scenario could not find the requested
left-side attachment target after pressing the original pin. Existing tests
keep every persistence/geometry/edge/content assertion; only their removed
dropdown setup changes to side selection.

Magnet mode is transient UI state. Pointer capture keeps the press-drag-release
gesture on the magnet; rendered target hit-testing follows pan, zoom and focus.
Four named side buttons support the click and keyboard path. Escape, pointer
cancel, blank-canvas click and invalid drop discard the mode. Existing dock
data and layout/routing code are reused. An undocked note is selected above its
former parent so its magnet remains reachable when their bounds overlap.

The annotation form has scoped font/field/chevron/focus/disabled/button styles,
separate field groups and wrapping actions. The native note select is retained.
The obsolete docking picker and its CSS are removed.

- `npm run build`: PASS; `npm run build:pages && npm run test:pages`: PASS2/2.
- Dedicated local server4362 and ignored `output/playwright/w011.config.ts`
  (same tests/assertions, base URL/port changed): full existing/new suite PASS35/35.
- Initial keyboard/undock sequence exposed a detached note behind its selected
  parent; selecting the detached note fixed reachability. Targeted recheck PASS,
  followed by the full35/35 run. No assertion or timeout was weakened.
- Synthetic CUA board, no user board: side previews and the annotation form
  visually checked at1280x720. Font, chevron inset, disabled/enabled actions,
  spacing and keyboard focus match the app. Local captures:
  `output/playwright/magnet-w011.png`,
  `output/playwright/annotation-panel-w011.png`.
- `git diff --check`: PASS. Existing upstream build warnings remain nonfatal.

Independent review and adverse observations are recorded below. Final exact-head
CI, integration and deployment evidence live in [PR10](https://github.com/ehlyzov/theboard/pull/10).
Publication is authorized but must wait for those gates; no successful future
run or human functional acceptance is implied by this technical completion.

## Independent review and integration gate

Separate fresh-context read-only review of
`bcc902ef61c6fb266888b4be13353fca2f760f78` against base434f363: PASS in the
observed scope, no actionable product defect. Isolated git archive, own4363
server/browser profiles, unchanged test assertions. All15 affected tests PASS.
Additional observed PASS: selecting the correct side of a second screen;
Escape during a captured highlighted drag with whole-archive equality;400%
zoom after Alt-pan with actual22px hit band and successful coordinate click;
360px form with a long note choice, no horizontal overflow, visible focus and
wrapped actions. Root/user boards and shared builds were not touched.

Full native-select keyboard selection is BLOCKED by the review browser
environment: headless and headed Chromium show the same failure on a minimal
standalone native select without app code/CSS. Native semantics remain;
programmatic selection and real keyboard activation of linking buttons PASS.
Do not describe that as native-select keyboard-selection coverage. Other browser
engines and touch hardware remain unverified.

Local independent report:
`/tmp/theboard-magnet-review-bcc902e/REVIEW.md`; screenshots/logs under its
`output/` directory. Author full35/35 and Pages2/2 evidence is separate.
[Source CI42663792286](https://github.com/ehlyzov/theboard/actions/runs/42663792286)
passed editor-checks and pages-checks; PR deployment correctly skipped.

This completion update changes reports/status only. Reviewed product/test bytes
remain bcc902e. The final report head still requires up-to-date protected CI;
PR10 records final SHA, main/deployment run and public smoke. Next product
scope remains the existing queue, including W005 Markdown.
