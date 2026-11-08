# W009 — keep the mask visible while composing its note

Status: active. Owner: TheBoard chat. Branch: fix/keep-mask-visible-during-note.
Base:de0fc9f8a8115fb0ac66b7b2d62b74d3b5e23bac. Human acceptance pending.
Source: direct owner request,2026-11-09: show the highlighted screen fragment
while creating its associated note.

MASK-14: after Enter finishes painting, retain the same visible mask over its
source screenshot throughout note composition/selection. The pending preview
is passive and transient, uses normalized geometry, and is never a saved mask
or empty note. Successful attachment replaces it with exactly one saved linked
mask; cancellation removes only the pending preview. Existing saved-mask links,
zoom, history and archives keep their established behavior.

Checks before behavior: tests/regions.spec.ts adds a focused visible-target,
typing, source isolation, provisional export, cancel and commit regression.
Run it red, build and affected cases, then one fresh-context independent review
and protected CI. No private board or user-browser changes.
Technical verdict: NOT_RUN. Next: reproduce, implement, verify and review.
