# W010 — Apache license and GitHub Pages

Status: done. Owner: TheBoard chat. Base:714931dcd2e8a66b05cfa7f96f5d22496cd7a805.
Branch: feat/apache-license-and-pages. Human acceptance pending.
Source: direct owner request,2026-11-09: add Apache licensing and publish TheBoard
on GitHub Pages. Existing instruction: checks must be green before publication.

- LICENSE-01: canonical Apache License2.0 for project code, matching package
  metadata/README, copyright notice and preserved dependency license notices.
- PAGES-01: application and lazy layout assets work at /theboard/; home/query
  navigation, local persistence and archive exchange preserve this prefix.
- PAGES-02: publish only the static application and legal notices, never private
  boards, test artifacts or credentials. Localhost boards transfer via ZIP.
- PAGES-03: deploy the tested Pages artifact only from main after both original
  editor checks and Pages production smoke checks pass. Use normal protected PR
  integration and verify the public URL after deployment.

Check before behavior: dedicated production-prefix smoke scenario, first run
against the existing build to reproduce the absolute-home link defect. License
changes use exact-source/diff checks. Keep all30 existing tests unchanged; add
separate Pages config/tests and isolated dist-pages output. Independent review
covers license packaging, workflow gates and prefix behavior. Public smoke after
actual deployment; no user browser or private board mutations.
Technical verdict: PASS (local, independent, hosted CI and live publication).
Human acceptance remains pending; publication was explicitly authorized.

## Implementation checkpoint

Test-only67f08ac failed meaningfully on the absolute home link: expected
/theboard/, received /. Vite now separates root and Pages modes/output folders,
and the brand uses the compiled base URL. Two Pages production smoke cases
PASS: editor/lazy ELK/reload/archive/fresh-profile import/home navigation, plus
exact project license/notice serving and dependency notice presence.

Apache text is copied unchanged from the official Apache2.0 license. Package
and lock root metadata use Apache-2.0. Build packaging includes canonical
LICENSE/NOTICE and full installed production dependency licenses, preserving
ELK's separate EPL option. Only static build output is uploaded.

The workflow retains all existing editor checks and adds a Pages check job.
Main-only deploy needs both jobs, uses the tested Pages artifact, and scopes
Pages/OIDC write permissions to deployment. Official released action versions
were verified through GitHub API (all JS actions use Node24). The Pages site
was previously disabled (GET404); configuration/public validation still pending.
No private boards or user browser sessions have been operated. Independent
review and exact final-head CI remain required before publication.

Local verification: `npm run build && npm test` PASS (30/30 unchanged editor
checks); `npm run build:pages && npm run test:pages` PASS (2/2). Production
artifact scan PASS: eight static files, no private project content, archives,
source maps or user assets. LICENSE SHA256:
`cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`
(matches the official Apache source byte-for-byte). `git diff --check` PASS.

## Publication result

Released implementation: `8f9cd0c03827c4757ff216f8359bc73269a0e211`, merged
through [PR8](https://github.com/ehlyzov/theboard/pull/8) from reviewed candidate
`36c6fd1f1442d5c8799c0d18f48ef816540398f3`.

The separate fresh-context reviewer reproduced both Pages checks and all30
original editor checks in isolated builds/profiles, and the meaningful red
home-prefix assertion at67f08ac. License text matched the official source;
all29 production package license files were retained verbatim; the eight-file
artifact contained no boards or private assets. Workflow review found no
blocking issue. Report retained locally at
`/tmp/theboard-pages-review-36c6fd1/REVIEW.md` (not needed to use the app).

- [PR CI42529583900](https://github.com/ehlyzov/theboard/actions/runs/42529583900):
  editor-checks and pages-checks PASS; deployment correctly skipped on PR.
- [Main CI/deployment42529806183](https://github.com/ehlyzov/theboard/actions/runs/42529806183):
  editor-checks, pages-checks and deploy all PASS for8f9cd0c.
- Live origin: [TheBoard](https://ehlyzov.github.io/theboard/).
  `PAGES_URL=https://ehlyzov.github.io/theboard/ npm run test:pages` PASS2/2:
  synthetic editing, lazy layout, persisted reload, ZIP exchange, prefix-safe
  home navigation and exact legal assets. No private/user browser was used.
- GitHub recognizes Apache-2.0. Pages uses Actions and HTTPS; the deployment
  environment allows protected branches only. Main retains up-to-date required
  editor checks, mandatory PR integration and administrator enforcement.

LICENSE-01 and PAGES-01..03: PASS. This is technical verification, not claimed
human functional acceptance. Browser storage is origin-specific: move localhost
boards using ZIP export/import. The publication does not implement GitHub board
synchronization or the separately queued offline-startup/Markdown features.
Next: use the public app and continue the existing product queue. This
report-only follow-up preserves the reviewed implementation; its own final CI
and deployment links are recorded in its PR.
