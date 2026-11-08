# W004 — screenshot region discussions

Status: active. Owner: TheBoard chat. Source: direct owner request for a mask-like
region selector, linked highlighted comments, additional replies, and completion
without removing comments from history. No new approval required.

REGION-01: draw a rectangular image region and attach a comment.
REGION-02: selecting it highlights its discussion and allows another comment.
REGION-03: complete a comment while retaining it visibly in history.
REGION-04: reload and archive roundtrip preserve regions, comments, and status.
Tests: tests/regions.spec.ts, before implementation. Non-goals: freehand masks,
remote identities, collaboration. Geometry is declarative normalized image
coordinates; stable region/comment IDs and timestamps are portable data.
