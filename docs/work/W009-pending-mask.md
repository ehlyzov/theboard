# W009 — visible annotation targets and nearby notes

Status: done (bounded technical outcome). Owner: TheBoard chat; independent
reviewer. Branch: fix/keep-mask-visible-during-note.
Base: `de0fc9f8a8115fb0ac66b7b2d62b74d3b5e23bac`.
Reviewed product candidate: `745caf15afc1963d7b76e295eec7d7dd2f044499`.
Human functional acceptance: pending.

## Outcome and accepted criteria

Source: direct owner requests on2026-11-09. Keep a painted fragment visible
while writing its note; fix a new mask-linked note placed far from its screen
by automatic layout. The owner explicitly requires green GitHub pipelines
before integration.

- MASK-14: the Enter-completed mask remains a passive normalized preview on
  its source throughout note composition/selection. It is not saved/exported
  prematurely. Confirm commits one linked mask; cancel removes only the preview.
- MASK-15: automatic and temporary-focus layouts keep undocked linked notes
  near a primary source, preserving note IDs/content, all semantic links,
  explicit docks and navigation transitions. Manual placement remains manual.

Annotation satellites reserve measured space beside a source composite with a
32px gap. Shared notes choose the lowest visible screen ID; explicit docks take
priority. Real incident edges have separate solver ports with padding bridges
back to actual composite boundaries. No note is implicitly docked or duplicated,
and no annotation link becomes a navigation edge. Association IDs invalidate
both layout modes when an existing note gains/loses a link. Geometry and passive
engine metadata remain declarative. See the [algorithm](../research/board-layout.md#mask-linked-ordinary-notes-w0092026-11-09)
and [format](../board-format.md#annotation-composition-and-placement).

## Test-first observations and adjustments

`bba374e`: pending-preview scenario failed on the absent visible target.
`50a6919`: first linked-note fixture lacked required portable positions and
failed import; this was a fixture error, not missing-behavior evidence.
Corrected `70c990b` failed meaningfully on source-note gaps of1433px RIGHT and
1669px DOWN instead of under100px. The implemented cases pass.

The focus regression fixture gained an upstream screen to force a different
global rank. An already compact global neighborhood need not move in focus;
the upstream rank makes its explicit temporary-position delta meaningful. That
async delta is polled. All persistence, viewport and geometry assertions remain.
No required outcome or precision threshold was weakened.

## Verification

Author: `npm run build`, `git diff --check`, ten affected browser cases and
`npm test` all PASS; full suite30/30,5.4s. Source candidate
[required CI](https://github.com/ehlyzov/theboard/actions/runs/42526005187/job/128869645745)
PASS. Previous main's latest pipeline was also checked green before integration.

Fresh-context independent review of exact745caf1/base de0fc9f: **PASS**, no
actionable product findings. Isolated git archive, own preview4350/browser and
outputs; shared source/dist and user boards unchanged. Environment: macOS arm64,
Node25.3.0/npm11.7.0, Playwright1.65.0/Chromium158. Independent build and all ten
affected scenarios PASS. Additional adverse observations:

- Passive preview geometry/typing/export/commit/cancel at zoom; pre-Enter Escape;
  existing saved rectangular-mask linking does not create a duplicate preview.
- RIGHT/DOWN mixed image ratios, all dock sides, cross-source explicit dock,
  shared notes, parallel/back edges and transient-port ID collision: finite
  orthogonal routes, real-boundary endpoints, zero measured node/label overlaps
  and route/node or route/label interior hits in those fixtures.
- Removing the primary mask reassigns a shared note to its remaining source,
  preserving identities/content, remaining links, docks and navigation edges.
- Isolated private-scale derived case with49screens/51notes/120edges places one
  generic new annotation32px to its source's right, aligned inY. Export semantics
  and explicit docks match the imported pre-layout baseline. Real currently
  edited user boards were not opened/replaced; no private assets enter this repo.

Review-harness corrections are not product fixes: the zoom setup first tried
clicking an offscreen marker, then painted while visible before changing zoom;
the private archive uses inline positions, and import adds decoded imageSize,
so equality correctly uses a pre-layout export baseline. No thresholds weakened.
The reviewer did not rerun the unrelated full suite or GitHub pipelines.

## Integration and limits

[PR7](https://github.com/ehlyzov/theboard/pull/7) carries final-head CI and merge
records. This final report/status-only follow-up retains the reviewed source.
Exact final-head protected CI must pass before merge; verify the resulting main
pipeline before delivery. Technical PASS does not imply human acceptance.

Many annotations enlarge a reserved box. One shared note cannot be adjacent to
several distant sources at once. Arbitrary dense graphs, universal no-crossing
behavior and other browsers are not established. No new stored schema field or
remote service is introduced. Next product scope remains W005 Markdown.
