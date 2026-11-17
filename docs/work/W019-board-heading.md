# W019 — keep the board title above the canvas

Status: done for implementation and verification. Owner: TheBoard chat.
Branch: `fix/canvas-heading-overlap`.
Base: `3ed13f8253b28062aefe348d5d9851950f6e4880`.
Source: owner screenshot feedback on 2026-11-17. The board heading overlaps a screen card header when the card fills the canvas.

UI-06: display the board title in the application header, outside the panning and zooming canvas. Keep it visible in a dedicated header row at narrow widths, and truncate long titles within the header. Keep the workspace title in the desktop sidebar. Preserve the board controls and data.

Check before implementation: extend the Pages browser suite with a synthetic board title check at desktop width and at 400% canvas zoom, then switch to tablet and phone widths and verify the same heading fits above the canvas. Reproduce the failure before the product edit. Run an independent bounded review and protected CI before publication.

The test-first commit `3fe379c` failed on the base build because the heading was absent from the application header. Candidate `f8ae4381e153720f97374b48d7b35f97966371cc` puts the heading in the existing header and removes the duplicate canvas heading and subtitle. Below 1200px the heading has its own row. At phone widths the toolbar uses the freed space near the top of the canvas.

Author `npm run build:pages` and `npm run test:pages -- --workers=1 --trace off` passed (10/10, logs `/tmp/theboard-w019-build.log` and `/tmp/theboard-w019-pages.log`). A fresh-context reviewer independently built the exact candidate and passed `npm run test:pages -- --grep UI-06 --workers=1 --trace off` (1/1). The test verifies 400% zoom, title/canvas separation, and both ZIP buttons at 1440, 1024, and 390px with synthetic board data. Human acceptance is pending. Next step is the protected PR and Pages rollout, with public verification recorded on the PR.
