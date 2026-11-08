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

## Scope reconciliation after owner steering

The current canonical list is [requirements](../product/requirements.md),
MASK-01..10, NOTE-01, VIEW-01/02, DOC-01..04, UI-01. The initial rectangle and
separate-comment description above is historical and superseded by freehand
brush masks linked to ordinary note nodes. Earlier texts require migration.
Markdown documents, deep-linked text fragments, 400% zoom, workspace restoration,
and the reported header layout repair are also requested. This task remains
active; none of the unreviewed current code is declared done.

Test-only states: 2af334c (original region semantics), 5e20cdd (400% zoom),
626fe41 (Markdown and viewport checks), edcf54f (latest mask-to-note semantics).
The first original region check failed meaningfully on missing selection UI.
A rectangle prototype later passed seven tests; that result is historical and
does not verify the replacement brush model. Current code is uncommitted and
not yet buildable while the model is being replaced. Independent review and CI
for the final brush/document candidate have not run. Human acceptance: pending.

Method deviation: rapidly arriving amendments were not reconciled into the
canonical docs immediately. They are now recorded explicitly, with supersession
and truthful implementation status. Do not reuse old green results to accept
the changed model. Complete focused checks, record a candidate, then request
one independent review plus targeted repair recheck before integration.
