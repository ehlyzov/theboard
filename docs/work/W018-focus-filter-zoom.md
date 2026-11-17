# W018 — independent focused-list filter and retained navigation zoom

Status: active. Owner: TheBoard chat, single writer. Branch: fix/focus-list-navigation-zoom.
Base: a101ea7387fb9acf6f2685f137116671211e7620.
Source: owner screenshot feedback2026-11-17: hide nonhighlighted items for “Only selected”, retain the previous focus behavior for “Show all”, and do not reset a user-adjusted zoom on navigation.

## Criteria before implementation

- FOCUS-08: separate the sidebar list filter from the canvas focus control. With focus active, “Show all” keeps the full clickable list and its existing current/neighbor emphasis; “Only selected” hides rows outside the current direct incoming/outgoing neighborhood. Preserve original numbering. Switching the list filter must not exit focus or change canvas geometry/viewport. Turning focus off shows the full list; retain the filter preference for returning to focus. Workspace-only setting, no board/archive schema changes.
- VIEW-04: after a user changes zoom with wheel/pinch or +/- controls, navigating to another/current sidebar screen or a canvas screen, entering/exiting focus, temporary-layout recomputation and reload preserve that scale, including400%. Recenter the relevant screen without fitting away the chosen scale. Before explicit zoom adjustment, retain existing automatic framing. “Show entire board” remains an explicit fit action and establishes the resulting scale for later navigation.
- FOCUS-05/06/07 and ARCH preservation: temporary focus positions/routes/notes remain canonical-data independent; both manual/automatic global modes, RIGHT/DOWN, source switching, stale results, reload/export and normal viewport restoration when no explicit zoom change occurs.

Scope interpretation: the screenshot has nonhighlighted rows in the left screen list while unrelated canvas nodes are already hidden. The optional owner question distinguishes sidebar filtering from canvas changes; proceed with the sidebar interpretation if no correction arrives. No private board edits/tests or unrelated product changes.

Checks: test-first synthetic independent filter/zoom regression in editor and production Pages; existing focus/layout/note/connection tests via the dedicated focus button; one fresh-context read-only reviewer at an exact candidate; final protected CI and public Pages verification. Human functional acceptance remains pending.
