# Current owner requirements

This ledger reconciles the owner's direct instructions and explicitly relayed
clarifications. `approved_by_human` means requested behavior, not functional
acceptance of the implementation. Conversation language is Russian; canonical
repository documentation is English. Last reconciled: 2026-11-08.

## Established product

| ID | Requirement | Source / decision | Implementation evidence |
| --- | --- | --- | --- |
| BASE-01 | Public GitHub repository | Initial direct request, approved_by_human | Repository created |
| BASE-02 | No proprietary server board storage; user GitHub folder OR browser storage | Initial direct request, approved_by_human | Browser storage implemented; GitHub pending D3 |
| BASE-03 | Offline-first, archive import/export | Initial direct request, approved_by_human | ZIP and IndexedDB verified W003; offline app startup pending |
| BASE-04 | Upload named screenshots, arrange screens, directed arrows, notes | D1/D2, approved_by_human | W002/W003 review and CI PASS |
| BASE-05 | Maximally declarative, agent-friendly board information | Direct instruction, approved_by_human | board.json + assets + CLI; docs/board-format.md |
| LANG-01 | English repository documentation/README; Russian owner communication | Direct instruction, approved_by_human | PR #2 merged, independent semantic/language check |

## Current editing increment

All requirements below are `approved_by_human`; runtime claims require the
current candidate's checks and independent review. W004 is active, not accepted.

| ID | Required behavior | Status / verification |
| --- | --- | --- |
| MASK-01 | Paint a freehand selection over a screenshot using a brush; do not modify source image pixels | In implementation; replaces initial rectangle-only interpretation |
| MASK-02 | Adjustable brush radius with a visible circle showing brush size; radius changes affect subsequent strokes | In implementation |
| MASK-03 | Preserve mask geometry in image coordinates through zoom and movement | In implementation; needs focused zoom test |
| MASK-04 | Undo last draft stroke, clear draft mask, finish or cancel drawing; preserve saved annotations | In implementation; needs focused checks |
| MASK-05 | Link a finished mask to an existing ordinary note OR create and link a new ordinary note | Latest clarification; tests/regions.spec.ts updated before implementation |
| MASK-06 | Selecting a saved mask highlights its linked notes; allow another note link | In implementation |
| MASK-07 | Cancel drawing/note selection without empty notes or damage to existing data | Test drafted; implementation pending review |
| MASK-08 | Delete the selected saved region with Undo; delete mask/link only, retain image and ordinary notes | Explicit relayed owner addition; not yet verified |
| MASK-09 | Preserve mask-to-note links after reopening, reload, archive export/import | Roundtrip test drafted; current brush model not yet verified |
| MASK-10 | Preserve earlier separate-comment text by migration to ordinary linked notes or compatible retention | Latest clarification; migration pending verification |
| NOTE-01 | Completed annotation records remain available in history | Original direct instruction; in the latest model completion belongs to the retained ordinary note, never destructive deletion |
| VIEW-01 | Allow canvas zoom to 400% | Direct instruction; earlier rectangle candidate test PASS; current candidate requires regression check |
| VIEW-02 | Restore the working board after reload; browser local storage is allowed | Direct instruction; IndexedDB content PASS W003; viewport/last-board restoration pending |
| DOC-01 | Add a Markdown document node by importing a file or creating an empty document | Direct instruction; test drafted, implementation pending |
| DOC-02 | Link document nodes to screens | Direct instruction; implementation pending |
| DOC-03 | Annotate selected document text using a deep link in Markdown, shown as an annotation on the text fragment | Direct instruction; test drafted, final note-link adaptation still pending |
| DOC-04 | Keep document/fragment associations declarative and portable with the board | BASE-05 applied to documents; implementation pending |
| UI-01 | Fix wrapping/overlap of the saved-status label in the header | Direct screenshot report; local CSS repair, pending independent review |

The initial separate-comment/rectangle model is superseded by the explicitly
relayed brush-to-ordinary-note model. Existing content must survive this change.
For Markdown, apply the same ordinary-note model to fragment annotations;
there is no separate new comment entity or Add comment workflow.

## Local PlanItForMe deliverable

| ID | Requirement | Evidence |
| --- | --- | --- |
| UFD-LOCAL-01 | Import updated v0.8 screenshots and supplied graph; never present baseline v0.7 as updated | 32 updated screen nodes imported |
| UFD-LOCAL-02 | Preserve supplied transition/note semantics; layout-only changes allowed | 76 labels and 33 note texts match source after reload; only note y positions adjusted |
| UFD-LOCAL-03 | Separate local board, saved portable ZIP, URL, overview image; no public project-material upload | Delivered in the private cross-project handoff; no materials tracked here |
| UFD-LOCAL-04 | Apply mask/note amendments to the same local board without clearing its existing notes | Board URL retained; new editing behavior still in implementation |

Full local paths, board IDs, and private audit materials belong in the requested
cross-project handoff, not this public repository. Source UFD semantics are not
invented from screenshot numbering.

## Still open

D3 (GitHub exchange/conflict policy) and D4 (real-time collaboration) remain
`proposed`, not implicitly approved. GitHub access and license remain undecided.
No functional human acceptance is inferred from a technical PASS.

## Additional interaction requirements

- UI-02 (`approved_by_human`, relayed screenshot defect): opaque transition
  labels above every edge line; readable when several transitions converge.
- VIEW-03 (`approved_by_human`, direct instruction): a modifier-drag gesture
  pans the canvas regardless of the object under the pointer. Use familiar
  Space-drag behavior, with Alt-drag as an alternative; preserve text typing.

Delivery order: the PlanItForMe local blockers (UI-02, MASK-01..10) are a bounded
first slice. Markdown documents remain required but do not block that slice.
