# Safe production activation — 23 September 2026

Status: blocked before production writes or rule publication. No account was duplicated, password changed, or school record modified.

Complete current Firebase Emulator test suite rerun: **12 passed, 0 failed**. Includes browser Firebase authentication, role boundaries, administrative matrix, student CRUD/imports, attendance/calling, audit integrity and synchronization queue behavior. These are isolated tests, not production Web/Android synchronization proof. Expected PERMISSION_DENIED messages are negative security assertions. Backup script syntax and its actual read-only execution passed.

## Verified production inventory

Existing project: `school-managment-8c102`, default Firestore database.
Existing designated Auth UID: `F2k0InkD73eV9bDjXRNzl1Bw34j1`, enabled with Email/Password provider.
No `schools` membership namespace exists. The owner selected the option to supply the existing school tenant ID; its value is still required. Do not interpret the option number `2` as the tenant ID.

Recursive collection inventory found 13 documents and no additional collections:

| Root collection | Documents | Migration issue |
|---|---:|---|
| students | 2 | No GR number, division, or academic year fields. Retain document IDs; obtain authoritative missing values. |
| teachers | 1 | Profile is not an Auth membership. Do not infer a UID or grant roles from a name/mobile. |
| attendance | 1 | No stable student ID, division or academic year. Requires an explicit reviewed student linkage. |
| notices | 9 | New schema uses notifications; preserve original content and identifiers during a reviewed mapping. |

No cloud settings, templates, classes, academic years, fees or documents collections were returned. This does not imply those records do not exist in browser-local storage or another source. Web operational pages still use browser storage; Android currently routes to account authentication/security, not integrated operational screens. Authentication activation alone will not enable cross-device synchronization.

## Backup and rollback

Read-only utility: `school-erp-pro/backend/scripts/production-preflight.cjs`.
Run from backend: `node scripts/production-preflight.cjs school-managment-8c102` using the authorized Firebase CLI session.
It recursively inventories paginated collections, including missing parent documents, and saves raw Firestore values/update times plus the published rules/release metadata. It performs no production document or rules writes.

Private backup: `school-erp-pro/backend/production-backup-1790135134351.local` (Git ignored; not a downloadable website asset).
SHA-256: `71e6d4fbe8967f267298a63e4b002ba3af259232f69e303efab0ef805c25c456`.
JSON readback verified. This is a paginated snapshot, not an atomic managed export or a tested restore. Before migration, quiesce writes and recheck each source updateTime; stop if any source changed.

Migration must be copy-only into `schools/{confirmedSchoolId}`. Never move/delete source documents. Preserve original document IDs and retain a private source-to-target manifest. Resolve missing GR/division/year/student linkage before generating writes. Create destinations only with an exists=false precondition; never overwrite conflicting records. Validate copied counts, values, indexes, references and audit metadata before switching clients. Do not import unidentified browser data automatically.

Before any rollout, save the current rules release, both client configurations and source revision. Roll back application configuration only to a verified compatible version. Do not automatically restore the old allow-all-authenticated rules as a security rollback. A tested restricted compatibility ruleset that preserves authorized legacy access is still required. Therefore backup exists, but complete executable rollback readiness is NOT yet PASS.

## Membership and security gate

Use exactly `schools/{confirmedSchoolId}/members/F2k0InkD73eV9bDjXRNzl1Bw34j1`.
Existing schema: `role: SUPER_ADMIN`, `active: true`, `passwordSetupComplete`, `modules`, `resources`, `classIds`, `studentIds`. Module grants must include actual portal destinations; resource grants use `shared/school-data-schema.json` excluding audit_logs. No password or password hash belongs in this document. Preserve the existing Auth account. Do not assert password setup completion merely from the existence of a password provider.

Current published rules allow every authenticated user to write every document, including a newly provisioned membership. The proposed school-scoped rules deny all legacy root paths. Consequently neither unprotected membership creation nor publication of the current candidate satisfies the owner's safety conditions. A protected bootstrap/legacy-compatible rollout must be prepared and verified before production changes. No alternate permission system or hard-coded login has been added.

Required pre-deployment proof: confirmed tenant ID; protected membership; reviewed legacy mappings and authorized legacy client access; complete emulator suite; restore/rollback rehearsal; web and Android runtime configuration for the same school; authenticated client tests. Admin SDK or Console access bypasses rules and is not proof that the school account can sign in successfully.

## Manual information needed now

1. Send the existing school tenant ID selected in the clarification question. This is the school path ID, not the Firebase project ID or a password.
2. Firebase Console > existing project > Firestore Database > Data > students: review each existing record and supply its authoritative GR number, division and academic year through a reviewed migration mapping. Do not edit/delete production records just to satisfy this preflight.
3. Firestore Database > Data > attendance: identify the exact student document corresponding to the historical record. Do not infer this from names alone.
4. Authentication > Users: the existing administrator UID has already been verified; do not add a duplicate or change its password.
5. Do not click Publish in Firestore Rules. Console actions alone cannot repair the outstanding client integration and legacy-schema incompatibilities.

Real-account Web login, Android login and both synchronization directions remain unverified. The project is not FINAL.
