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

| [W004](W004-region-comments.md) | Screenshot region discussions and retained completion history | active | TheBoard chat | Tests before implementation, review |
