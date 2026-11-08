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
current candidate's checks and independent review. W004 has technical PASS;
human visual feedback is positive, while full functional acceptance is pending.

| ID | Required behavior | Status / verification |
| --- | --- | --- |
| MASK-01 | Paint a freehand selection over a screenshot using a brush; do not modify source image pixels | Implemented; browser and independent W004 review PASS |
| MASK-02 | Adjustable brush radius with a visible circle showing brush size; radius changes affect subsequent strokes | Implemented; browser and independent W004 review PASS |
| MASK-03 | Preserve mask geometry in image coordinates through zoom and movement | Normalized coordinates; independent zoom/movement check PASS |
| MASK-04 | Undo last draft stroke, clear draft mask, finish or cancel drawing; preserve saved annotations | Browser and independent keyboard/draft checks PASS |
| MASK-05 | Link a finished mask to an existing ordinary note OR create and link a new ordinary note | Existing/new ordinary-note links; browser roundtrip PASS |
| MASK-06 | Selecting a saved mask highlights its linked notes; allow another note link | Implemented; browser and independent W004 review PASS |
| MASK-07 | Cancel drawing/note selection without empty notes or damage to existing data | Browser and independent cancellation checks PASS |
| MASK-08 | Delete the selected saved region with Undo; delete mask/link only, retain image and ordinary notes | Delete/Undo and stale-reference regression PASS |
| MASK-09 | Preserve mask-to-note links after reopening, reload, archive export/import | Reload and portable roundtrip PASS |
| MASK-10 | Preserve earlier separate-comment text by migration to ordinary linked notes or compatible retention | Compatibility migration implemented; independently exercised in the earlier UI review |
| NOTE-01 | Completed annotation records remain available in history | Retained ordinary-note status/timestamps; independent history check PASS |
| VIEW-01 | Allow canvas zoom to 400% | Current brush model: 400% and viewport reload regression PASS |
| VIEW-02 | Restore the working board after reload; browser local storage is allowed | IndexedDB W003 PASS; current viewport/focus reload PASS |
| DOC-01 | Add a Markdown document node by importing a file or creating an empty document | Direct instruction; test drafted, implementation pending |
| DOC-02 | Link document nodes to screens | Direct instruction; implementation pending |
| DOC-03 | Annotate selected document text using a deep link in Markdown, shown as an annotation on the text fragment | Direct instruction; test drafted, final note-link adaptation still pending |
| DOC-04 | Keep document/fragment associations declarative and portable with the board | BASE-05 applied to documents; implementation pending |
| UI-01 | Fix wrapping/overlap of the saved-status label in the header | CSS repair; independent visual review PASS |

The initial separate-comment/rectangle model is superseded by the explicitly
relayed brush-to-ordinary-note model. Existing content must survive this change.
For Markdown, apply the same ordinary-note model to fragment annotations;
there is no separate new comment entity or Add comment workflow.

## Local PlanItForMe deliverable

| ID | Requirement | Evidence |
| --- | --- | --- |
| UFD-LOCAL-01 | Import updated v0.8 screenshots and supplied graph; never present baseline v0.7 as updated | Latest private board: 49 screens imported |
| UFD-LOCAL-02 | Preserve supplied transition/note semantics; layout-only changes allowed | Latest private board: 120 transitions, 50 ordinary notes, assets/IDs/content preserved; independent equality checks PASS |
| UFD-LOCAL-03 | Separate local board, saved portable ZIP, URL, overview image; no public project-material upload | Delivered in the private cross-project handoff; no materials tracked here |
| UFD-LOCAL-04 | Apply mask/note amendments to the same local board without clearing its existing notes | Same URL replacement/recovery and 49 docked ordinary-note pairs verified by the source operator |

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

Markdown DOC-01..04 is the next bounded task W005. Its early failing draft
remains under docs/work/drafts/documents.spec.ts, outside the current executable
suite; it is not reported as passing or implemented.

- FOCUS-01 (`approved_by_human`, direct instruction): focus mode shows the
  selected screen and the direct destinations of its outgoing edges. Hide
  unrelated canvas content without deleting or moving it. Selecting a visible
  destination changes the focus source; leaving focus restores the full board.
  Persist focus workspace preferences with the viewport. Browser and independent
  focus/reload checks PASS; distant neighborhoods frame the source readably.

- LAYOUT-01 (`approved_by_human`, direct screenshot feedback): transition labels
  must clearly identify their edge and avoid overlap with other labels and
  diagram nodes. Provide manual layout adjustment, storing geometry in a
  separate `layout` section of the portable file, not mixed with graph meaning.

- MASK-11 (`approved_by_human`, direct instruction): draw thin visual connectors
  from a saved mask to its ordinary linked notes; hovering the mask highlights
  those notes. These connectors express note links, not navigation edges.

- MASK-12 (`approved_by_human`, direct screenshot feedback): select the brush
  with B or the marker icon in the specific screen header, beside its other
  tools. B targets the hovered or selected screen; an unfinished mask stays
  attached to its screen until completion/cancellation. Use keyboard radius
  controls without per-screen size buttons/sliders. This supersedes the earlier
  common-toolbar placement. Multiple strokes form one draft mask until completion.
  Show a trash icon on a selected saved mask. Preserve Delete/Undo semantics.
- IMAGE-01 (`approved_by_human`, explicitly relayed instruction): portrait and
  landscape cards follow intrinsic image aspect ratio, show all pixels without
  cropping/stretching, and retain normalized mask geometry and note links.
  Account for resulting bounds in layout. Do not alter source screenshot pixels.

- DOCK-01 (`approved_by_human`, direct instructions, terminology corrected to
  notes): dock/undock an ordinary note to any side of a screen card. The note
  extends the composite card; arrows on that side connect to the note's outer
  boundary. A docked note stretches to the full length of that side. Preserve
  its identity/content, and keep docking geometry in the separate layout section.

- NOTE-02 (`approved_by_human`, direct instruction): choose a note background
  from eight pastel colors. Preserve color on normal and docked notes through
  reload and portable archives.

- ROUTE-01 (`approved_by_human`, direct instruction): avoid coincident edge
  paths using separate lanes and more space. Treat screen+docked notes as a
  composite obstacle. Preserve graph semantics; geometry remains layout data.

- LAYOUT-02 (`approved_by_human`, direct instruction): research and document
  suitable placement/routing algorithms, including the chip-placement analogy.
  [Research and a synthetic feasibility probe](../research/board-layout.md) are
  recorded. Measured ELK layered/orthogonal layout is integrated; fixed-node
  obstacle routing remains pending. Geometry checks do not prove optimality.

- LAYOUT-03 (`approved_by_human`, direct clarification): show a dashed leader
  from a transition label to its arrow only while hovering the label. Retain
  transition/endpoint highlighting; hide the leader at rest.

- FOCUS-02 (`approved_by_human`, direct screenshot feedback): in focus mode,
  gray out sidebar screens outside the current visible neighborhood. Keep them
  clickable; clicking any screen changes the focus source to that screen.

- AUTO-01 (`approved_by_human`, direct instruction): integrate the demonstrated
  layout into the full editor, preserving its existing tools and persistence.
- AUTO-02 (`approved_by_human`, direct instruction): allow automatic layout to
  be switched off for manual arrangement. Enabling it must warn that manual
  layout will be reset; cancellation preserves the manual arrangement.
- ARCH-05 (`approved_by_human`, explicitly relayed owner instruction): support
  replacing the contents of the current board from a validated ZIP while keeping
  its URL. Keep a recovery copy. Normal import still creates an independent board.

- FOCUS-03 (`approved_by_human`, direct screenshot feedback): clearly emphasize
  the current screen and its visible destinations in the sidebar. Add a left
  sidebar switch for showing all versus the focused neighborhood, synchronized
  with the existing focus control. Inactive items remain clickable.

- UI-03 (direct discoverability feedback): keep the mask tool easy to find in
  the full editor through a marker pictogram in each screen header, beside
  deletion. It is a screen operation, not a common board-level creation tool.
  B and bracket shortcuts remain supported. The standalone example is read-only.

- UI-04 (`approved_by_human`, direct screenshot feedback): navigation, zoom
  and edge-label hints belong in the bottom status area with the other text,
  outside the diagram. Apply this to the editor and the standalone example.

- FOCUS-04..06 (`approved_by_human`, direct instruction): automatically arrange
  the current screen and its outgoing destinations close together in focus.
  This is temporary view geometry, never canonical board/archive geometry.
  Leaving focus restores all original block positions, routes and labels.
  Recompute on source changes/reload and discard stale results. Preserve note
  docking and editing; ordinary content edits and explicit global layout actions
  retain their established persistence semantics. See [W006](../work/W006-focus-layout.md).

## Verification scope

W004's full independent integration review and targeted repair reviews cover
MASK/VIEW/NOTE/IMAGE/DOCK/FOCUS, archive replacement, measured automatic layout,
manual cancellation and hover-only leaders. The latest contextual-marker/footer
delta has a test-first regression and independently passed its narrow recheck. See
[W004](../work/W004-region-comments.md) for exact candidate provenance.
Proper edge crossings remain; zero crossings/global optimality are not promised.
DOC-01..04, GitHub exchange and offline application startup remain unimplemented.

- UI-05 (`approved_by_human`, direct instruction): remove the standalone
  example footer's redundant read-only/400% caption. Preserve actual controls
  and navigation hints; annotation tools remain part of the main editor.
