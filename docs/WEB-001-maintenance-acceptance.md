# WEB-001 - Medication maintenance acceptance

Operator-run acceptance, 2026-10-12. Partial WEB-001 implementation, not closure.
No backend/migration/key changes. Two distinct synthetic WEB-EDIT-* records were
created for this acceptance; both remain inactive in development afterward.

## Real Edge acceptance

ADMIN used the front/gateway/Catalog owner at 1366x900 and 390x844.

- Editing read ETag 0, sent If-Match and returned 200/version 1 with the new name.
  Unit of measure stayed disabled in the UI and unchanged at the owner.
- A separate real request changed the same record to version 2. The stale UI edit
  received 412, left the concurrent name intact, and disabled blind replay.
- Explicit review loaded the owner's version and replaced/discarded the old draft.
- A subsequent edit committed version 3, but its browser reply was replaced with
  503. Account/navigation remount preserved the command. Explicit retry sent the
  same body/If-Match and returned 412, not a second mutation. Owner GET still
  reported version 3 and the intended name. Explicit review displayed that state.
- Canceling the deactivation confirmation left the record active. Confirming then
  returned 200/version 4 and active=false; the UI/listing showed the inactive state.
- INVENTORY, SUPERVISOR and CONSULTATION had no edit command; direct PUT and
  deactivate POST returned 403 for each role on both viewports.
- Screenshots were inspected with no page exceptions/document horizontal overflow.

This does not claim that a 412 proves a preceding request succeeded: another actor
could have changed the record. The operator must inspect the current state before
starting a new change. No automatic version refresh-and-write or force overwrite exists.

## Automated checks and limits

Portal: 16 passing tests (four reader, six creation, six maintenance). Maintenance
covers owner versions, immutable unit, confirmation, 412/review, exact uncertain
replay/remount, duplicate clicks, malformed/missing ETag, rejected corrections,
failed reads and disposed writes. Shell: 15 passing tests, including versioned
response extraction, logout protection and conditional route/role/header scope.
CI runs model/client tests, not this operator browser/backend acceptance.

Pending memory does not survive logout/reload. No reactivation/delete/user creation,
production packaging, mockup visual adaptation, integrated QA or HU closure is claimed.
The screenshots/browser driver remain local-only artifacts.
