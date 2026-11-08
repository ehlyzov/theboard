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

| [W007](W007-preview-caption.md) | Remove redundant standalone preview caption | active | TheBoard chat | Bounded cosmetic edit and review |
