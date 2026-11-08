# W009 — keep the mask visible while composing its note

Status: review. Owner: TheBoard chat. Branch: fix/keep-mask-visible-during-note.
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

## Linked-note placement amendment

The owner also reported a newly linked note far from its source with global
automatic layout enabled. Existing layout treated undocked notes as disconnected
roots: mask noteIds were absent from its constraints. MASK-15 requires ordinary
linked notes to remain near their source in automatic and temporary focus
layouts, while preserving note IDs/content, explicit docks and navigation edges.
Manual mode remains manually placed. Shared notes have one deterministic
primary visible source (lowest stable screen ID), retaining every semantic link.
The annotation cluster is layout-only; never silently dock or duplicate a note.

Check both RIGHT/DOWN, multiple and shared links, source composites, absence of
phantom transitions, linking an existing note and focus export restoration.
The algorithm will reserve measured space for annotation satellites before ELK,
keeping navigation ports on actual screen/composite boundaries.

## Implementation checkpoint

Test-onlybba374e failed on the absent pending preview. The preview is now a
passive rendering of the existing pendingRegion state, cleared on cancel and
replaced by one saved mask on attachment. No provisional board data is written.

Initial linked-note fixture50a6919 was invalid because portable positions were
missing; this was a fixture failure, not evidence of missing placement. Corrected
fixture70c990b failed meaningfully: source-note gaps1433px RIGHT and1669px DOWN
instead of under100px. New reserved satellite boxes keep notes near their source
without changing semantic data. Association IDs now invalidate full/focus
layout when an existing note gains a link. Real edge ports remain on composite
boundaries, with unique transient solver IDs and padding bridges where needed.
See [algorithm](../research/board-layout.md#mask-linked-ordinary-notes-w0092026-11-09).

The focus regression fixture now includes an upstream screen: a global graph
that is already compact need not move just because focus is enabled. The new
parent forces a different global rank, preserving the explicit position-delta,
viewport-fit and restoration assertions; the delta is polled as an async result.
No persistence outcome or threshold was weakened.

Build PASS. Ten affected mask, annotation and focus cases PASS. Full suite and
independent review pending; final exact-head GitHub CI must be green before
protected integration, as explicitly requested by the owner.
