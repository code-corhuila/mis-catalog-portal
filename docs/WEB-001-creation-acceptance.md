# WEB-001 - Medication creation acceptance

Operator-run acceptance, 2026-10-12. Partial WEB-001 implementation, not closure.
No backend, database migration, dependency version or credential changes are needed.

## Real development acceptance

Edge/Playwright used ADMIN through mis-front and the real gateway/Catalog API
at 1366x900 and 390x844. Each run submitted a distinct synthetic WEB-* medication.

- The real owner committed with 201, then the browser received a substituted 503.
  Fields stayed locked. Switching to account and back restored the pending body.
- Explicit retry returned 200, with the same ID, key and body as the first call.
  The owner GET matched all six submitted fields. Paginated owner listing contained
  exactly one medication with that code. The UI refreshed page 1 after confirmation.
- A new intention using the occupied code returned 422 and unlocked the form.
- INVENTORY, SUPERVISOR and CONSULTATION had no creation command; a direct POST
  from each account returned 403, on both viewports.
- Desktop/mobile screenshots were inspected; no page exceptions or document-level
  horizontal overflow were detected. Existing table scrolling remains intentional.

Two synthetic medications remain in dev; they are not clinical data. No record
was deleted to hide evidence. Browser screenshots/driver are local-only artifacts.

## Automated checks and limitations

`npm test`: 10 passing tests, comprising four reader and six creation model tests.
Creation covers field normalization/lengths, lost acknowledgement/remount/replay,
duplicate clicks, locked pending bodies, definitive rejection/fresh key, malformed
acknowledgements, post-confirmation refresh failure and disposed responses.
CI runs these model tests, not browser/backend acceptance.

Pending intent is memory-only and belongs to the current login. Logout/reload
does not recover it. There is no automatic write retry or optimistic insertion.
Editing/deactivation with If-Match, user creation, production packaging, mockup
visual adaptation and QA are outside this increment.
