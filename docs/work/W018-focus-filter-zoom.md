# W018 — independent focused-list filter and retained navigation zoom

Status: done (technical implementation/review; protected rollout recorded in branch PR). Owner: TheBoard chat, single writer. Branch: fix/focus-list-navigation-zoom.
Base: a101ea7387fb9acf6f2685f137116671211e7620.
Source: owner screenshot feedback2026-11-17: hide nonhighlighted items for “Only selected”, retain the previous focus behavior for “Show all”, and do not reset a user-adjusted zoom on navigation.

## Criteria before implementation

- FOCUS-08: separate the sidebar list filter from the canvas focus control. With focus active, “Show all” keeps the full clickable list and its existing current/neighbor emphasis; “Only selected” hides rows outside the current direct incoming/outgoing neighborhood. Preserve original numbering. Switching the list filter must not exit focus or change canvas geometry/viewport. Turning focus off shows the full list; retain the filter preference for returning to focus. Workspace-only setting, no board/archive schema changes.
- VIEW-04: after a user changes zoom with wheel/pinch or +/- controls, navigating to another/current sidebar screen or a canvas screen, entering/exiting focus, temporary-layout recomputation and reload preserve that scale, including400%. Recenter the relevant screen without fitting away the chosen scale. Before explicit zoom adjustment, retain existing automatic framing. “Show entire board” remains an explicit fit action and establishes the resulting scale for later navigation.
- FOCUS-05/06/07 and ARCH preservation: temporary focus positions/routes/notes remain canonical-data independent; both manual/automatic global modes, RIGHT/DOWN, source switching, stale results, reload/export and normal viewport restoration when no explicit zoom change occurs.

Owner clarification2026-11-17: “Да, скрывать строки слева.” The list filter is independent of canvas focus; unrelated canvas nodes remain hidden exactly as before. No private board edits/tests or unrelated product changes.

Checks: test-first synthetic independent filter/zoom regression in editor and production Pages; existing focus/layout/note/connection tests via the dedicated focus button; one fresh-context read-only reviewer at an exact candidate; final protected CI and public Pages verification. Human functional acceptance remains pending.

## Results and repair

Test-only `3684a3d`: after restoring the missing official Playwright headless cache, the normal-navigation test failed meaningfully (400% reset to100%); manual/automatic tests failed on the missing independent filter. Evidence: `/tmp/theboard-w018-red2.log`. Early augmented low-scale click tests timed out on tiny grip/image targets; the fixture now clicks the pointer-enabled annotation container, retaining the canvas navigation/5% assertion.

Initial candidate `9dd5a0c8e5e04781fd97f62931ec024aef3d2eef`: author full66/66 PASS (`/tmp/theboard-w018-full.log`), production build and Pages8/8 PASS (`/tmp/theboard-w018-build.log`, `/tmp/theboard-w018-pages3.log`). Existing tests use the dedicated canvas focus button; original canonical geometry/export/normal viewport checks remain. The previous current-entry auto-refit assertion is replaced by exact chosen-scale preservation per VIEW-04.

Fresh-context read-only review at9dd5a0c: focused11/11 PASS; additional direction/filter400% probe PASS. Reviewer found P2: a native pan was incorrectly treated as a zoom choice. After pan, automatic focus framing stayed100% and clipped neighbors; no-pan control fitted52.8042% with all context visible. The original full review was FAIL. Report and synthetic screenshot: `/tmp/theboard-w018-review/review.md`, `filtered-synthetic.png`; failure evidence retained in `pan-verify.log` and `pan-focus.png`.

Test-only `d760259` adds a visible-context pan regression to editor and Pages, observed RED (`/tmp/theboard-w018-pan-red.log`). Final runtime `c05ee2af8eb78704ff73e882ef4b4b30c2e20453` compares native gesture start/end zoom; pure pan no longer establishes a navigation scale. Workspace preferences are independent of canonical board data; focus exit retains the normal-view center at the newly chosen scale.

| Final check | Result |
| --- | --- |
| Author focus-navigation4 and focus-layout2 | PASS6/6 (27.7s); `/tmp/theboard-w018-repair.log` |
| Author rebuilt Pages distribution and full Pages suite | PASS build and9/9 (23.9s); `/tmp/theboard-w018-build2.log`, `/tmp/theboard-w018-pages4.log` |
| Independent targeted repair at exactc05ee2a | PASS repository6/6 (19.0s) and independent3/3 (9.8s); `/tmp/theboard-w018-review/repair-c05ee2a/` |

Reviewer confirmed pan leaves the chosen-scale preference absent and focus frames52.8042% with all context visible, matching the no-pan control.400% survives direction recomputation/filtering; wheel/control, reload/export and ordinary viewport restoration checks pass. P2 repaired; no additional finding. Reviewer stopped all owned browsers/servers and made no repository changes.

Final production app JS SHA256: `6322dd74ab18aa144091e0f0e32a60bf0fb40c67618b73e52d2094bede4fb15a`; CSS: `55fa82db58f3835a99bd01aa6c4073b6facfac530c7dc797e59301bb7a4246b3`.

## Rollout and limits

The branch PR records final-head full editor67/Pages9 CI, protected merge, main deployment and public Pages9/9 plus index/JS/CSS byte comparison. These are release gates, not claimed completed by this report-only commit. Final runtime checks above remain applicable to report-only follow-ups. No user browser, UFD or comments were edited/tested. Native trackpad pinch was NOT_RUN; wheel and zoom controls were exercised. Human functional acceptance pending; next product task W005.
