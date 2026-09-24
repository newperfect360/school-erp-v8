# Perfect Education platform administration — 24 September 2026

## Scope and authority

- Public route: https://www.perfectedu.co.in/platform-admin. Production `/admin` also opens this panel; development `/admin` retains its existing development-only implementation.
- Existing owner email explicitly selected by the owner: dilippawar2207@gmail.com. Existing Firebase UID: F2k0InkD73eV9bDjXRNzl1Bw34j1.
- Separate server-controlled `platform_members/{uid}` record: `role=PLATFORM_SUPER_ADMIN`, `active=true`. School membership alone does not authorize platform actions. Direct client writes to platform authority records remain denied.
- Existing `schools/gbs-school`, UDISE 27190113523, school administrator membership and password were not changed. Existing school is listed directly, not copied/migrated into another tenant.

## Implemented

Firebase-backed school creation/editing, unique UDISE/tenant/school-code validation with transactional reservations, activation/deactivation, school statistics, search, CSV platform reporting, activity logs, platform settings, plan metadata and school-admin membership management. Password creation/recovery uses Firebase reset email; no administrator password is stored by the platform backend.

Open School provides an explicitly identified **read-only inspection** of school collections (first 200 records per collection). It retains tenant context on refresh and has Back to Platform Admin. It does not impersonate a school user or add hidden school memberships. This is not an editable instance of the full school ERP dashboard.

The subscriptions view manages plan metadata, not payment processing or automated subscription billing. Totals count tenant collections; legacy root records are preserved and are not silently counted as migrated tenant records.

## Verification

The integration test in `backend/tests/production-tenant.test.mjs` actually creates two emulator schools, edits school metadata, creates school-admin memberships, writes different students through the protected repository, denies cross-school reads and platform privilege escalation, and verifies the platform can inspect both. Browser automation submits Add New School, verifies the created school, tests reload/context retention and logout, and rejects school-admin platform login. All assertions passed on the final run. Temporary test records exist only in disposable emulators.

Web build passed. Production owner password login and real authenticated platform interactions remain unverified until the owner enters their private Firebase password. Emulator test success is not production login proof. Do not label production ready.

Production deployment: `dpl_9KAy5XLhRt3q6YTsgYNTw6egRozQ`, https://school-6m1973v1r-perfect360.vercel.app, READY. Real Chrome opened https://www.perfectedu.co.in/platform-admin and displayed the platform sign-in form. Live API rejects anonymous platform-list with HTTP 401; live UDISE resolver still returns gbs-school for 27190113523. Cloud Function deployment completed successfully. Owner private login requested; no password captured.

## Backup and rollback

Fresh read-back-verified snapshot: `school-erp-pro/backend/production-backup-1790230666654.local`.
SHA256: `cb6fd700feccd03888f2e7723092c044b827518a7811706be7e3f08ff3de548c`.
Includes 16 documents and prior published Firestore rules. Paginated snapshot, not an atomic managed export. Bootstrap compared every pre-existing document updateTime except ephemeral rate limits before and after grant; no school records changed.

Rollback: deactivate only the new platform authority record through trusted administration to revoke platform access; restore the previous Function/frontend versions if required. The snapshot contains prior rules for reviewed rollback. No legacy data deletion or restoration is needed because the change did not migrate or delete it. Preserve any subsequently created real schools; do not restore a full snapshot over newer data.

## Files

- `backend/functions/platform.js`: authenticated platform operations and audited school management.
- `backend/functions/index.js`: platform action dispatch through the existing HTTPS backend.
- `backend/firestore.production.rules`: SCHOOL_ADMIN compatibility without granting platform access.
- `backend/scripts/bootstrap-platform-owner.cjs`: backup-verified grant to the explicitly confirmed existing account.
- `src/pages/PlatformAdministration.jsx`, `platform-administration.css`: independent platform panel.
- `src/main.jsx`: platform routing and production admin alias.
- `src/backend/firebaseRepository.js`, `useSchoolSession.js`: SCHOOL_ADMIN role compatibility.
- `src/backend/productionAuth.js`: remove duplicate post-login verifier; the session hook still fails closed on tenant verification.
- `src/pages/SchoolLogin.jsx`: platform link.
- `src/pages/PerfectEduHome.jsx`: multi-school management and platform reports content.
- `backend/tests/production-tenant.test.mjs`: executable platform/security/browser regression coverage.
