# WEB-001 - Catalog visual acceptance

Operator-run Edge acceptance, 2026-10-12; partial visual alignment, not HU closure.
Styles now match the shell's reference palette, compact headings, primary/destructive
commands, explicit status labels and contained tables. Shadow DOM isolation remains.

- All 16 existing reader/creation/maintenance model tests passed; CI does not render Angular.
- Real login/list reads, details and creation/edit form entry/cancel passed at
  1366, 801, 800, 390 and 320 px. The unit-of-measure field stayed disabled.
- Desktop/mobile UI-only intercepted 503/remount/retry preserved the same pending
  creation body/key and locked fields. No request reached the owner write endpoint.
- Mobile CONSULTATION had no creation command. Existing backend permissions remain unchanged.
- Non-table controls fit their host; no document horizontal overflow/page exceptions.
  Wide tables intentionally scroll internally. Desktop/mobile screenshots were inspected.

The browser driver/screenshots are local-only artifacts. Host-injected antivirus
resources were blocked only in the test browser; no antivirus settings were changed.
No data, migrations, credentials, model behavior or dependency versions changed.
Real summary/alert screens, production packaging and integrated QA remain pending.
