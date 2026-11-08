# Working on TheBoard

Read `CONTRIBUTING.md`, `docs/work/tasks.md`, and the current task card before
starting. Product requirements live in `docs/product/mvp-brief.md`.

- Repository documentation and instructions are written in English. Communicate
  with the owner in Russian. Preserve original-language user content and test fixtures.
- Keep board data agent-friendly and declarative: stable IDs, explicit nodes,
  edges, labels, notes, positions, and asset paths. See `docs/board-format.md`.
- One active modifying task and one writer for the entire project. Other agents
  may investigate and review read-only.
- A task card transfers context; it is not an atomic lock. Do not start a second
  writer until the first has finished or explicitly handed off the task.
- Preserve user-assigned roles. A reviewer does not fix product code.
- For product changes, record observable criteria and executable checks before
  implementation. Never weaken expected outcomes to obtain green tests.
- Return new material behavior choices to the owner. Do not ask again about
  behavior already specified. Continue unrelated authorized work.
- For a product candidate or workflow change, run one separate reviewer subagent
  with a fresh context. Supply the task, original decisions, exact SHA, and
  commands, without the author's persuasive summary. The reviewer reads,
  reproduces checks, and reports; it does not modify files.
- Models: ordinary implementation and review use `gpt-6.1-sol`, `high`; simple,
  unambiguous tasks use `gpt-6-luna`, `max`. Report unavailable models instead of
  silently substituting. Use Astra only for a specifically bounded difficult
  assignment under the owner's global agreements.
- One full review and a targeted recheck of repairs. Another full review needs
  a new material reason.
- PASS, FAIL, BLOCKED, and NOT_RUN describe observations. Technical PASS is not
  human acceptance. Do not describe self-review as independent.
- Do not create coordination infrastructure, skills, or reporting formats
  without a concrete need in the next product task.
- On completion, record results, limitations, and the next step in the card.
  Never publish private chats, another project's internal materials, secrets,
  or real user boards in this public repository.
