# Test-data cleanup — 20 September 2026

## Status: pending; nothing deleted

The owner identified both localhost and Vercel as containing test records. These are separate browser origins. The React app still reads/writes browser localStorage through `src/storage.js`; file attachments use IndexedDB database `school-erp-assets-v1`, store `assets`. A fresh automation browser cannot inspect the owner's normal browser records.

The current App uses the local preview login and selectable role state. Firebase client/repository code exists but is not connected to this App's record storage and login. A secure Admin-only destructive reset cannot be claimed on this basis. Web/Android shared-data synchronization is not verified or operational in this app flow.

## Implemented prerequisite

- `school-erp-pro/src/services/cleanupBackup.js`: read-only export of React-owned raw storage values and attachment bytes. Timestamped filename with origin; SHA-256 integrity check; refuses changed localStorage during export or unreadable attachment files.
- `school-erp-pro/src/components/CleanupBackup.jsx`: download archive and reselect the saved file to verify its checksum against the export in this session.
- `school-erp-pro/src/pages/BackupRestore.jsx`: connects the export/verification controls to the existing Backup page. Existing merge backup/restore retained.
- `school-erp-pro/tests/cleanup-backup.spec.js`: isolated-browser verification of actual download/re-upload, binary preservation, corruption rejection, mismatched backup rejection and source preservation. No students created.

This archive covers the React browser origin only. It is NOT a full Firebase/database backup and is NOT accepted by the old record-merge restore. It excludes authentication credential stores, legacy root app storage and remote/Android files. It can contain private school records/settings and must be stored privately. No deletion mechanism is enabled by exporting or verifying it.

## Required before deletion

1. Deploy the backup capability to the same Vercel application and use it in the owner's existing browser. Use the existing localhost origin separately; a new port will not contain that origin's records.
2. Save and reselect each dated backup. Actual backup filenames, paths, contents/counts and verification results are not available yet. Test-browser exports are not school backups.
3. Inventory legacy, cloud and Android data, if any, and back them up independently before changing them. Confirm school master/configuration values from the actual stores without deleting them.
4. Connect verified school Admin authentication before exposing destructive reset. Implement scoped reset with preserved configuration/templates/accounts, typed `DELETE TEST DATA`, verified current backup and final confirmation; include dependent records/files and recovery validation.
5. Verify actual cleanup and all requested workflows. Do not seed new students after cleanup.

## Validation completed

- Production build: passed.
- Two Playwright backup tests: passed, disposable context only.
- Lint: no errors; seven existing warnings in unrelated files.
- Diff whitespace check: passed.
- Home dashboard inspected: student/attendance/teacher counts derive from stored collections, not fixed demo numbers.

## Not completed

Actual school backup, deletion, Admin reset page, empty-screen evidence, complete production CRUD/import/photo/document regression, cloud database backup and web/Android synchronization. No production deployment performed. Source code, official identity/logo, templates, configuration and school records have not been removed.
