# W019 — keep the board title above the canvas

Status: active. Owner: TheBoard chat. Branch: `fix/canvas-heading-overlap`.
Base: `3ed13f8253b28062aefe348d5d9851950f6e4880`.
Source: owner screenshot feedback on 2026-11-17. The board heading overlaps a screen card header when the card fills the canvas.

UI-06: display the board title in the application header, outside the panning and zooming canvas. Keep it visible in a dedicated header row at narrow widths, and truncate long titles within the header. Keep the workspace title in the desktop sidebar. Preserve the board controls and data.

Check before implementation: extend the Pages browser suite with a synthetic board title check at desktop width and at 400% canvas zoom, then switch to tablet and phone widths and verify the same heading fits above the canvas. Reproduce the failure before the product edit. Run an independent bounded review and protected CI before publication.
