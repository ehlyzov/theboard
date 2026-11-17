# W020 — show screen numbers and frame the top on navigation

Status: done for implementation and verification. Owner: TheBoard chat.
Branch: `feat/screen-card-number`.
Base: `145f329843893aa6e8b0a7e0dd6044d60c95707b`.
Source: owner screenshot feedback on 2026-11-17. A screen card shows only its title, so it cannot be identified by the number used in the sidebar.

UI-07: show the sidebar screen number immediately before the editable title on each screen card. Derive both labels from full board screen order with the same zero padding. Notes do not participate. Focus and sidebar filtering preserve numbers. Deletion updates both locations consistently, and reload preserves numbering from the saved board order. Numbers are presentation only and do not alter saved titles, IDs, or archive schema.

Check before implementation: add a Pages test with screens and an interleaved note, filter to a later screen, verify the number against the sidebar, then delete a preceding screen and reload. Run the failing test before editing the product, then verify the candidate in an independent bounded review and protected Pages rollout.

VIEW-05, owner follow-up on 2026-11-17: at a chosen zoom, navigate to the screen itself. Show its upper part when the full card does not fit, including in focus mode. Center horizontally and use a small inset at the top of the canvas. When the screen fits, center the screen itself. Docked notes do not determine its framing. Preserve the selected zoom, automatic focus framing before manual zoom, and saved board geometry.

VIEW-05 test-first check: navigate at 400% to a screen with top and bottom notes, both through the regular sidebar and in focus. Measure the real card and image against the canvas viewport. Run the checks before and after implementation.

UI-07 failed for the absent card number in test-first `803d8e5`. The author passed all 11 Pages tests on the number implementation and a reviewer independently passed UI-07 at `a40928b9d7bb708f14d17d86ab952a703b94fdee`, including visual checks at 90% and 130%.

VIEW-05 test-first `81e00ee` failed on the clipped top at 400%. The author passed 12/12 Pages tests at `d60774b`. The independent review reproduced a fit-sized card clipped by a fixed minimum inset. `fcf3a96` adds the regression for a fully fitting card with only 20px to spare. It failed before the fix. Final runtime candidate `35bca4113bd6754dc401ff619b9ac35bc067dfe5` centers that card and uses a top inset for an oversized one only. Author build and UI-07/VIEW-05 passed (2/2). Independent targeted recheck passed VIEW-05 at the exact candidate, covering the oversized card in ordinary and focus navigation and the fully fitting card at 400%. The reviewer stopped local processes and changed no workspace files.

Production verification uses synthetic board data. Human acceptance remains pending. Next step is protected CI and Pages publication, with deployed checks recorded in the PR.
