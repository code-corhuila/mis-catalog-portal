# WEB-001 reader acceptance

Operator-run on 2026-10-12, America/Bogota, with Angular 21.2.25 and Playwright/Edge.
Desktop 1366x900 and mobile 390x844 were tested through mis-front localhost:5173
using the existing dev gateway/Security/Catalog deployment, without backend changes.

Real checks: login/me, catalog listing, next/previous pages, loaded-page filtering,
snapshot details, view switching, remount and logout cleanup. Error 503 and empty
listing states used intercepted browser responses; retry then reached the real API.
Both viewports had no JavaScript page errors or horizontal document overflow.
The narrow table scrolls inside its container; Shadow DOM prevents shell CSS leaks.

Reproduce: install this repository's lockfile with npm ci --ignore-scripts, start
the paired mis-front catalog-shell increment, log in with a configured dev account,
open Catalog, change page, search within that page, open/close a detail, switch to
account and return, then log out. Never publish credentials or bearer tokens.

npm test runs four model tests; CI is not a browser or real-backend runner.
No create/update/deactivate forms, all-role browser matrix, AOT production bundle,
integrated reception, QA promotion or full WEB-001 acceptance is claimed here.
