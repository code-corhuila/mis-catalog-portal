# mis-catalog-portal

> catalog bounded context: web UI (remote)

Part of the **Medicine Inventory System** distributed system — team `medicine-inventory-system`, Grupo 1.
Governance and documentation live in [`mis-docs`](https://github.com/code-corhuila/mis-docs).

## Angular reader increment

Node 24+, `npm ci --ignore-scripts`, `npm test`. Angular 21.2.25 with zoneless
signals and native ESM/JIT; the locked packages are served locally, not from a CDN.
mis-front mounts `src/portal.js` using `mount(host, { request })`; the returned
cleanup removes the application and invalidates pending responses. No token or
login is owned by this portal. Requests use the injected authenticated gateway
client, limited to medication reads by the shell. See Angular's official
[createComponent API](https://angular.dev/api/core/createComponent).
Listing, pagination, page-local search and a snapshot detail view are implemented.
Creation/maintenance, AOT production packaging and integrated QA remain pending.
CI tests the model, not Angular rendering or the real backend. Browser acceptance
is run separately through mis-front; this increment does not close WEB-001.
Shadow DOM isolates CSS, not untrusted JavaScript; backend authorization remains authoritative.

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `mis-docs`.
