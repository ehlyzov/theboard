# TheBoard — first UFD MVP

Date: 2026-11-08. Initial mode: `quick-plan`; implementation now proceeds in
separate tasks. Original requirements, screen format, and editor are approved;
D3 and D4 remain open. W002 implemented the first editor and tested it in
Chromium. W003 adds local persistence and archives; see its card for evidence.

## Sources and facts

The owner's initial request on 2026-11-08 specified a new public GitHub
repository, a Miro-like board without its own storage, a user-selected GitHub
repository folder or browser storage, archive export/import, offline-first
behavior, and an initial UFD made of application screens, arrows, and notes.

The owner subsequently chose uploaded screenshots with titles and an editor
for positioning screens, drawing arrows, and writing notes. Those answers
approve D1/D2, not D3/D4. The project directory was initially empty, with no
existing scenarios, code, or tests. This brief originally described intended
behavior; current implementation status is stated separately below.

## Implementation status

W002: PNG/JPEG/WebP uploads with editable titles, screen placement, directed
arrows, notes, object/edge deletion, zoom, and pan. Its board existed only in
the open tab. [W002 evidence](../work/W002-ufd-editor.md):
`tests/editor.spec.ts`, UFD-01..UFD-04. Technical verification is not owner
functional acceptance.

W003: independent local board IDs, IndexedDB persistence, portable ZIP archives,
and editable edge labels. The owner additionally requires an agent-friendly,
maximally declarative format: [format v1](../board-format.md). The requirement
was explicit; agent-facing CLI/schema choices are implementation decisions.
GitHub synchronization and offline application startup remain pending.

## User outcome

The user assembles a path from named screenshots, understands transition
direction, and reads explanations near the relevant screens. Board data stays
in the user's selected storage and is portable as an archive.

Working interpretation: UFD means User Flow Diagram. Clarification is needed
only if the owner means another format.

## Established product boundaries

| Decision | Status | Source |
| --- | --- | --- |
| New public GitHub repository | `approved_by_human` | Direct owner request |
| Screens, arrows, and notes as the first outcome | `approved_by_human` | Initial task #1 |
| No TheBoard server-side board storage | `approved_by_human` | Direct constraint |
| User-selected GitHub repository folder | `approved_by_human` | Direct requirement |
| Alternative browser storage | `approved_by_human` | Direct requirement |
| Archive export/import | `approved_by_human` | Direct requirement |
| Offline-first | `approved_by_human` | Direct requirement |
| Declarative, agent-friendly board information | `approved_by_human` | Subsequent explicit owner instruction |

Both storage options remain in the product vision. Their implementation order
was initially undecided; this brief does not exclude GitHub from the first MVP.

## Proposed first user journey

The editor and images are approved. This is the intended journey, not a claim
that every step is implemented. GitHub exchange details depend on D3.

1. Open a board and add named screenshots.
2. Arrange screens and connect them with directed arrows.
3. Add notes; moving a screen preserves its connections.
4. Close and reopen the board with content and layout restored.
5. Continue without a network after initial application/board loading.
6. Export an archive and import it in another browser profile.
7. With GitHub selected, bind a repository/folder and exchange changes online;
   work from the local copy while offline.

No proprietary storage means no TheBoard server storing board data. Local
storage of images and board content is still necessary for offline work.

## Decisions

| ID | Options | Decision or recommendation | Impact | Status |
| --- | --- | --- | --- | --- |
| D1 | Images, interactive pages, or both | Uploaded screenshots with titles; direct owner answer, 2026-11-08 | Screen content, offline behavior, MVP size | `approved_by_human` |
| D2 | Editor or prepared-data viewer | Editor for placing screens, connecting arrows, and writing notes; direct owner answer, 2026-11-08 | Main journey and interactions | `approved_by_human` |
| D3 | Explicit GitHub fetch/save or automatic sync | Recommend explicit actions and clear local-change state; preserve both versions on conflict until the user chooses | Sync expectations and conflict handling; needs design before GitHub implementation | `proposed` |
| D4 | Real-time collaboration now or later | Recommend postponing it because the initial result does not require it | Shared repository access does not promise a shared live board session | `proposed` |

At discovery time the stack, GitHub authentication, board/archive format, and
license were undecided. W002 chose the stack and W003 defines the local format;
GitHub access and license remain open. Technical choices must preserve the
approved storage and offline constraints.

## Proposed acceptance criteria

These are intended checks, not results. D1/D2 approve the editor/image direction;
the detailed acceptance examples below were proposals and receive evidence
through individual task cards.

- Assemble and read a multi-screen flow with visible directed arrows and notes.
- Reopening retains images, text, positions, and connections.
- After initial loading, the application and locally available board open
  without a network and support the selected viewing/editing operations.
- An archive contains images and data; a clean-profile import restores the
  board without accessing its original storage.
- The selected GitHub folder can save/restore the board and images without
  touching unrelated files.
- Offline status, GitHub access failure, and version conflicts do not destroy
  local work or appear as successful synchronization.

## Next step

Complete W003's local persistence/archive slice. Resolve D3 and authentication
before GitHub exchange, and D4 before promising collaboration. Implementation
plans are separate artifacts built from approved decisions.

## Subsequent owner requirements

See the [current requirements ledger](requirements.md) for brush masks, note
links, deletion/Undo, Markdown documents, 400% zoom, workspace restoration,
and layout repair. These requests are approved behavior; their implementation
and verification status is recorded separately.
