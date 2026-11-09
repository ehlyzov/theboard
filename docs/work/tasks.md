# TheBoard task queue

One modifying task at a time. This queue and its cards share context; they are
not a technical lock. Read [CONTRIBUTING](../../CONTRIBUTING.md).

| ID | Outcome | Status | Owner | Next step |
| --- | --- | --- | --- | --- |
| [W001](W001-workflow.md) | Select a process and exercise MVP decision handoff | done | TheBoard chat; independent reviewer | Documentation pilot PASS; evidence in card |
| [W002](W002-ufd-editor.md) | Build UFDs from screenshots, arrows, and notes | done | TheBoard chat; independent reviewer | Technical PASS, PR #1; human acceptance pending |
| [W003](W003-board-archives.md) | Independent local boards, archives, declarative agent format | done | TheBoard chat; independent reviewer | PR #2 merged; technical PASS |

W002 was the first product slice, not the entire MVP. Browser persistence,
archives, offline startup, and GitHub remain product obligations; W003 addresses
local persistence and archives. D3/D4 do not block editor investigation, but
must be resolved before dependent synchronization or collaboration promises.

| [W004](W004-region-comments.md) | Brush masks, note links, workspace and composite layout | done | TheBoard chat; independent reviewer | Technical PASS; PR #3 integration record; next W005, human functional acceptance pending |

| W005 | Markdown document nodes, screen links, deep-linked text-to-note annotations | queued | Unassigned | Implement after bounded W004; failing draft retained |

| [W006](W006-focus-layout.md) | Temporary compact focus geometry without changing saved layout | done | TheBoard chat; independent reviewer | Technical PASS; PR #4 protected integration; next W005, human acceptance pending |

## Current verification checkpoint

The historical preparation notes above predate the completed independent main
review and its targeted focus/dock/handle repairs. Current local suite:23/23 PASS;
59418c8 required CI and narrow contextual-marker/footer review PASS. W004 is
technically complete; PR #3 carries the protected merge record. Only final
report/status changes follow that reviewed code; no unrelated audit is repeated.
The W004 card carries provenance, human acceptance and pending product scope.

| [W007](W007-preview-caption.md) | Remove redundant standalone preview caption | done | TheBoard chat; independent reviewer | Technical PASS; protected PR integration, historical example retained |

| [W008](W008-marker-size.md) | Discoverable size slider beside the active screen marker | done | TheBoard chat; independent reviewer | Technical PASS; local/CI27 of27; PR #6 protected integration |

| [W009](W009-pending-mask.md) | Visible mask target and nearby linked-note layout | done | TheBoard chat; independent reviewer | Technical PASS; local30/30, source CI green; PR #7 final-head/main pipeline gate |

| [W010](W010-license-pages.md) | Apache licensing and tested GitHub Pages publication | done | TheBoard chat | Published; independent review, CI/deploy and public smoke PASS; human acceptance pending |

| [W011](W011-context-panel-styles.md) | Consistent annotation form and direct magnet docking | done | TheBoard chat; independent reviewer | Technical PASS; final CI/integration/deployment evidence in PR10; human acceptance pending |

| [W012](W012-demagnetize-icon.md) | Crossed-out magnet for the demagnetize action | done | TheBoard chat; independent reviewer | Technical9/9 and icon/reload PASS; shared rollout with W013 |

| [W013](W013-note-owned-masks.md) | Note-owned masks, screen-core docks and visible nearest-boundary links | done | TheBoard chat; independent reviewer | Technical45/45, Pages2/2 and targeted recheck PASS; final rollout PR11; human acceptance pending |

| [W014](W014-visible-notes.md) | Visible new notes, transparent composite corners and unobtrusive text focus | done | TheBoard chat; independent reviewer | Local48/48, Pages2/2 and independent review/recheck PASS; final protected CI/deployment/public verification record in PR13; human acceptance pending |

| [W015](W015-composite-active-faces.md) | Transition endpoints use core spans and exposed dock faces | active | TheBoard chat | Test-first actual endpoint/handle geometry, implementation and independent review |
