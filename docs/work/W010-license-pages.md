# W010 — Apache license and GitHub Pages

Status: active. Owner: TheBoard chat. Base:714931dcd2e8a66b05cfa7f96f5d22496cd7a805.
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
Technical verdict: NOT_RUN. Next: tests, implementation, review, green CI/deploy.
