# W001 — select and exercise a minimal workflow

Status: done. Owner: TheBoard chat. Date: 2026-11-08. The project owner
requested a small-project adaptation of supplied research and an implementation
example. Process selection: `delegated_to_agent`.

## Choice

| Option | Benefit | Cost and limitation | Decision |
| --- | --- | --- | --- |
| Chat and a task list only | Fast start | Requirements and evidence disappear between chats | Rejected |
| Markdown in Git, one writer, separate review, PR | Recoverable context, low maintenance | Organizational coordination; concurrent writers are not technically excluded | Selected for pilot |
| Full OpenSpec with specialized skills and coverage schemas | Structure for many capabilities and changes | No code/scenario volume yet justifying extra formats | Deferred |
| Ownership registry, generations, protected jobs, shared environment | Controlled concurrency | Requires remote adapters, permissions, and race testing | Deferred until actual concurrency |

Retain scenarios before code, test-quality review, separate technical verdict
and functional acceptance, exact candidate references, and recovery from Git.
Do not transplant another project's domain systems or configuration.

## Sources

Read the owner-provided research and implementation chats and current local
implementation documents. Their private links, content, and environment details
are not published here. The example had a registry/checker prepared but still
needed remote adapters and server restrictions: copying text does not transfer
guarantees.

Public primary sources consulted on 2026-11-08:

- [Anthropic: Building a C compiler](https://www.anthropic.com/research/building-c-compiler):
  highlights test quality and context recovery; does not establish the benefit
  of multiple writers for this small project.
- [GitHub: protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches):
  server checks/exceptions are separate settings, not agent instructions.

## Pilot

Apply actual owner answers to D1/D2 and test whether a fresh reviewer can
recover scope and next steps from Git alone. Also distinguish a stale report
from evidence for a changed candidate. Excludes app implementation, product
tests, CI/atomic ownership/server merge enforcement, and re-auditing the other project.

Owner decisions, translated from the answers of 2026-11-08:
D1 — uploaded screenshots with titles. D2 — an editor for placing screens,
connecting arrows, and writing notes. Those answers did not approve D3/D4.

| ID | Check | Expected outcome |
| --- | --- | --- |
| WF-01 | Compare answers and product brief | D1/D2 approved_by_human; D3/D4 proposed |
| WF-02 | Fresh reviewer reads repository and original decisions only | Recovers screen format, editor, open choices, and next task without chat history |
| WF-03 | Apply report for SHA A to changed candidate B | Reject applicability to B; instruction check, not server enforcement |
| WF-04 | Compare status claims and files | No claim of a finished app, working CI, or atomic locks |
| WF-05 | Check links and diff | Existing targets and no whitespace errors |

## Evaluation

Record recovered facts, findings, and owner questions needed for recovery.
For W002, separately track time to demonstration, missed defects, review repairs,
human interventions, and available tool cost. Mark unavailable metrics unknown.
One successful trial establishes neither acceleration nor defect reduction;
comparison requires several comparable tasks.

## Results

Technical verdict: **PASS for the documentation pilot**, 2026-11-08.
Independent reviewer `workflow_review`, GPT-6.1 Sol High, fresh context, read-only,
received original decisions/criteria without the author's persuasion. This did
not replace self-review under an independent label.

- Base: `60de3a686eb25d5723986c9f6ff3f56717bf9565`.
- Reviewed candidate: `5de52038a46fd66fbf5b67ab2015a8e88c88ac7f`.
- Sources: product brief, AGENTS, CONTRIBUTING, queue, this card, README, PR template.
- Reviewer environment: Darwin 27.0.0 arm64, Git 2.54.0 (Apple Git-157), Python 3.14.2.
  No product build existed.
- Follow-up changed only the report/task status; it was not presented as the
  original reviewed SHA.

| Criterion | Outcome | Observation |
| --- | --- | --- |
| WF-01 | PASS | D1/D2 match answers; D3/D4 proposed and unchanged from base |
| WF-02 | PASS | 12/12 control facts recovered; 0 owner questions |
| WF-03 | PASS | Hypothetical base report rejected for changed D1/D2; no server enforcement test |
| WF-04 | PASS | Only docs, PR template, .gitignore; no false app/coordination readiness claim |
| WF-05 | PASS | Six local Markdown links resolve; clean whitespace diff |

WF-02 facts: named screenshots; screen/arrow/note editor; no proprietary server
storage; GitHub folder; browser storage; archive; offline-first; open D3;
open D4; W002 is the first slice; card/test before code; W001 retains the sole
writer until completion. This is the trial's checklist, not total requirement coverage.

Commands: `git show <candidate>:<path>` for seven documents;
`git diff --check <base> <candidate>`;
`git diff <base> <candidate> -- docs/product/mvp-brief.md README.md`;
`git ls-tree -r --name-only <candidate>`; tool version reads. All exited 0.
Python resolved candidate Markdown links against `git ls-tree`:
`checked=6 missing=0`. D1..D4 assertions passed: D1/D2 changed, D3/D4 unchanged.
No P0–P3 findings; zero review repairs.

Author's GitHub observations at that time:
`gh api repos/ehlyzov/theboard/branches/main/protection` returned
`Branch not protected` (404);
`gh api repos/ehlyzov/theboard/actions/workflows --jq '{total_count: .total_count}'`
returned `total_count: 0`. These observed settings did not test bypass prevention.

**NOT_RUN:** product runtime/test-first, human product acceptance, writer races,
forced stale-operation rejection, server merge blocking. No human evaluation
of this pilot had been received; technical PASS did not imply it. Cost unknown.
Next step at completion: W002, a concrete editor card and executable checks
before implementation. This trial established context recovery and document
consistency, not faster development or fewer defects.
