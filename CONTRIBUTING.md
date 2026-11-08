# Contributing to TheBoard

The owner delegated selecting a lightweight process on 2026-11-08. This pilot
uses one writer and a separate reviewer. These are working agreements, not a
proven error-prevention system. Write repository documentation in English;
communicate with the owner in Russian. Original user content may retain its language.

## Sources of truth

| Information | Canonical location |
| --- | --- |
| Current product requirements and decisions | `docs/product/mvp-brief.md` |
| Queue, current owner, next step | `docs/work/tasks.md` |
| Change goal, criteria, sources, progress, results | `docs/work/WNNN-*.md` |
| Product candidate and change discussion | One branch and GitHub PR per task |
| Observed outcomes | Addressable run logs/artifacts and a report with SHA |

Introduce GitHub Issues/Projects when an external queue is actually needed.
Explicitly move the source of truth rather than maintaining conflicting task
statuses. Markdown currently suffices.

## Change sequence

1. **Define the outcome.** Record the goal, requirement source, changed behavior,
   non-goals, and observable criteria. Use stable IDs such as `UFD-01` in test
   names; do not create an additional traceability manifest.
2. **Resolve real ambiguities.** Reference behavior already specified by the
   owner and proceed. Only a new material choice requires an answer. Agent
   recommendations do not become accepted requirements automatically.
3. **Take one task.** Record its owner, branch, and `active` status. Do not start
   another modifying task. Before handoff, stop the former writer and ensure
   its commands have finished; preserve SHA, uncommitted diff, and next step.
   There is no automatic timeout takeover.
4. **Checks before behavior.** Preserve a test-only commit or patch with base
   SHA, run it, and record the actual result. Missing new behavior should
   produce a meaningful red result where runnable; existing regression checks
   may already be green. Environment failure is BLOCKED; no execution is
   NOT_RUN. Documentation needs diff, link, and semantic checks rather than
   artificial red results or unrelated product tests.
5. **Implement a small result.** One PR contains necessary requirements, tests,
   and code. Update the affected canonical requirement in that task; keep its
   reasoning history in the card. Introduce shared infrastructure only with
   an immediate consumer.
6. **Review independently.** Another agent receives original requirements and
   an exact candidate in a fresh context, inspects assertions and behavior,
   and runs applicable regression checks. For critical data preservation,
   deliberately breaking a requirement in isolation can verify test sensitivity.
   Such experiments are not mandatory for cosmetic changes.
7. **Show the result.** Present understandable scenarios, expected/actual
   outcomes, a demonstration, and limitations for the specific SHA. Human
   code reading is not required. Existing implementation/publication authority
   needs no repeated permission; never invent human functional acceptance.
8. **Integrate and finish.** Check current head/base and results before merge.
   If code, tests, requirements, or environment changed, refresh affected
   checks. A report-only follow-up may retain earlier evidence if it names
   the reviewed SHA and its diff contains only reports/status, not changed
   behavior or requirements.

Queue statuses: `queued` → `active` → `review` → `done`, or `blocked` with a
reason. `done` refers to the outcome of that specific task. Product tasks record
technical verdict separately from human acceptance (`pending`, `accepted`, or
`rejected`, with a source). Completed documentation does not make the app ready.
Bootstrap documentation may go directly to main; product changes use PRs.

## Minimal task and review record

A card contains goal; status/owner; sources and accepted decisions; scope and
non-goals; criteria with IDs; affected requirements/dependencies; latest
SHA/branch; commands and actual outcomes; limitations; and next step.

A review records candidate/base SHA, requirement/test paths in that candidate,
environment/tool versions, commands, expected/actual outcomes, criterion
PASS/FAIL/BLOCKED/NOT_RUN, findings, and unverified areas. Include build artifact
references/hashes where relevant and UI captures when helpful. Do not attach
secrets or private user data.

Extra `coverage.json`, OpenSpec CLI, specialized skills, and an orchestration
service are unnecessary while this format preserves context and repeatable
checks. Introduce them only when evidence shows the simple format no longer works.

## Actual guarantees and limits

- Git versions requirements and candidates; reports identify the reviewed SHA.
- Single-writer ownership is organizational. Markdown, assignees, and
  instructions do not provide atomic claims or prevent direct-push bypasses.
- `editor-checks` builds the app and runs browser tests. Main requires PRs and
  successful up-to-date checks, including administrators. Settings were read
  through GitHub API; evidence is in W002. This does not replace technical
  review or functional acceptance.
- A fresh-context reviewer may still repeat the author's misunderstanding.
  Observable examples and meaningful tests remain necessary.
- W002 exercised runtime behavior and test-first; its card holds the evidence.
  Human acceptance is separate. Documentation pilot W001 did not establish these.

Before adding concurrent writers or a shared mutable environment, revisit
isolation and technical access control. Until then, do not promise rejection
of stale writers or concurrent deployments.

GitHub branch requirements and administrator exceptions are configured on the
server, not by this document:
[protected branch documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
