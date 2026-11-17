# W020 — show screen numbers and frame the top on navigation

Status: active. Owner: TheBoard chat. Branch: `feat/screen-card-number`.
Base: `145f329843893aa6e8b0a7e0dd6044d60c95707b`.
Source: owner screenshot feedback on 2026-11-17. A screen card shows only its title, so it cannot be identified by the number used in the sidebar.

UI-07: show the sidebar screen number immediately before the editable title on each screen card. Derive both labels from full board screen order with the same zero padding. Notes do not participate. Focus and sidebar filtering preserve numbers. Deletion updates both locations consistently, and reload preserves numbering from the saved board order. Numbers are presentation only and do not alter saved titles, IDs, or archive schema.

Check before implementation: add a Pages test with screens and an interleaved note, filter to a later screen, verify the number against the sidebar, then delete a preceding screen and reload. Run the failing test before editing the product, then verify the candidate in an independent bounded review and protected Pages rollout.

VIEW-05, owner follow-up on 2026-11-17: at a chosen zoom, navigate to the screen itself. Show its upper part when the full card does not fit, including in focus mode. Center horizontally and use a small inset at the top of the canvas. When the screen fits, center the screen itself. Docked notes do not determine its framing. Preserve the selected zoom, automatic focus framing before manual zoom, and saved board geometry.

VIEW-05 test-first check: navigate at 400% to a screen with top and bottom notes, both through the regular sidebar and in focus. Measure the real card and image against the canvas viewport. Run the checks before and after implementation.
