# PerfectEdu architecture and test report

Working local multi-school implementation. **Production conversion is not complete or deployed.**

## Routes and access

- Public product entry: http://127.0.0.1:5178/
- School login: http://127.0.0.1:5178/login
- Platform administration: http://127.0.0.1:5178/admin
- School dashboard: http://127.0.0.1:5178/school
- Debug APK download: http://127.0.0.1:5178/download-app

The intended public domain is https://www.perfectedu.co.in. No DNS or hosting deployment was performed.

The existing development owner credentials remain available. At `/admin` they authenticate the separate PLATFORM_SUPER_ADMIN audience. At `/login`, leaving UDISE blank permits only the existing GBS development owner to enter `gbs-school`. Other accounts require their school's code and password. This shortcut cannot enter other schools.

Platform Admin supports school creation/editing, immutable registered UDISE, search, activate/suspend/archive, first School Master Admin creation/reset, module selection, subscription/version fields, record counts, storage bytes, audit history and audited entry into an active school. Archived schools retain their records. Activation requires an active Master Admin.

School Super Admin retains the existing internal SUPER_ADMIN permission schema and exposes `schoolRole: SCHOOL_SUPER_ADMIN`. It is distinct from PLATFORM_SUPER_ADMIN. School users cannot obtain platform permissions or switch tenants. Individual users retain module/read-write and class permissions; new account passwords are salted and hashed. Password reset invalidates old sessions.

## Data boundaries

The development backend binds every opaque session to its school. Conflicting request/record school IDs are rejected. Suspension and module settings are checked server-side. Separate schools may use the same GR number or internal record ID without sharing records. Student QR references now include tenant IDs; legacy GBS QR references cannot select students in another school.

Web and Android use the same computer-hosted service and records, not browser-local/device-local operational databases. Existing browser data was not deleted or automatically copied. The existing frontend and Android project were extended, not replaced with a parallel app.

Local layout:

```text
school-erp-pro/.demo-data/
  school.json                   existing GBS store retained in place
  school.json.platform.json     registry and platform audit
  school.json.tenants/
    school-<uuid>.json          separate tenant stores
  perfectedu-migration.json     verified comparison and rollback source
```

QA uses a separately named registry and store. Vite denies direct access to data, backups, backend source and test fixtures. Ordinary paths and `/@fs/` paths were verified to return 403. There is no fixed school-count limit, but distributed operation and production scale are not certified by this local file-backed server.

New schools no longer inherit the GBS logo/name or example class-teacher names. Settings, templates and operational records are scoped independently. Excel import fixes the school to the authenticated tenant, requires year/class/division, rejects mismatched rows and tags imported students with that tenant. Certificates use school identity rather than PerfectEdu branding.

## Backup and existing school

Existing tenant ID: `gbs-school`. **Its verified UDISE is still missing; none was guessed.** Enter the verified 11-digit value at Platform Admin → existing school → Edit School → UDISE Number → Save School. Registered UDISE is immutable through ordinary editing.

232 local source/data files were copied and SHA-256 verified before conversion:

`C:\Users\PAWAR\Documents\GitHub\school-erp-v8\school-erp-pro\.demo-data\backups\perfectedu-2026-09-23T17-21-27-525Z`

An additional exact pre-link data copy is:

`C:\Users\PAWAR\Documents\GitHub\school-erp-v8\school-erp-pro\.demo-data\school.json.pre-perfectedu-1790184257625`

The existing store was linked in place. Only tenant identity settings were added; operational records and user records were compared in full against the backup and remained identical.

| Existing local records | Before | After |
|---|---:|---:|
| Students | 4 | 4 |
| Teachers | 5 | 5 |
| Communication logs | 6 | 6 |
| Fees | 1 | 1 |
| Notices | 1 | 1 |
| Attendance draft entries | 1 | 1 |
| Academic context | 1 | 1 |

These are local counts, not production Firestore counts. The backup is not a cloud export. School identity, logo, source, templates and ID-card work were preserved. No production Firebase users, passwords, records or rules were changed.

Rollback: stop Vite; first preserve the current entire `.demo-data` directory; restore the pre-change source snapshot and exact pre-link `school.json`; restart the prior local version. Retain all newly created tenant files separately. Do not overwrite post-change work without reviewing it. No production-rule rollback is needed because none were deployed.

## Test results

The actual platform UI created TEST SCHOOL A (`DEMO000001`) and TEST SCHOOL B (`DEMO000002`). Tests submitted separate school logins, edited/imported students and verified school-specific document rendering.

- 19 existing Web workflow regression tests passed on isolated QA data.
- Platform onboarding/login/import browser test passed.
- 4 server/QR tests passed, including isolation, password hashing, persistence, duplicate checks and UTF-8 decoding.
- Final selected Android suite: 7 passed. Includes native Compose login forms for both UDISE codes, original owner login, repository integration and retained UI tests. These are JVM/Robolectric tests, not physical-phone tests.
- Each native school session read its Web-imported student, saved a different student edit and attendance draft, then independent Web logins verified those changes in the corresponding tenant.
- All 22 default templates rendered the current school's identity in each demo tenant. This does not certify every physical print layout or previously uploaded custom document.
- Web build/lint passed with 7 warnings and no errors. Android debug build/lint passed.

| Requested test | Local development result | Scope |
|---|---|---|
| PerfectEdu Platform | PASS | Local UI/server |
| Multi-School | PASS | Two real demo stores |
| UDISE School Identification | PASS | Two demo codes; GBS code awaiting verification |
| Tenant Isolation | PASS | Registers, sessions, roles, modules, QR and private files |
| School Admin Creation | PASS | Actual onboarding UI and login |
| Teacher User Creation | PASS | UI regression and scoped backend tests |
| Web Login | PASS | Separate school sessions |
| Android Login | PASS | Native forms, real demo server; phone pending |
| Web ↔ Android Sync | PASS | Student/attendance changes for both schools |
| Existing School Migration | PASS | Verified local in-place link only |
| Excel Import | PASS | Actual tenant-scoped imports |
| Templates | PASS | Identity rendering of 22 defaults and LC regression |
| APK Build | PASS | Debug only |
| Production multi-school activation | FAIL | Not implemented/verified/deployed against live Firebase |

Backend isolation tests cover students, teachers, staff, attendance, fees, results, notices, documents, certificates, library, sports, trips, academic years, communication logs, audit logs and template settings. That does not claim every native CRUD workflow was physically exercised.

## APK

`C:\Users\PAWAR\Documents\GitHub\school-erp-v8\android-app\GBSSCHOOL\app\build\outputs\apk\debug\app-debug.apk`

Version `1.0.0-perfectedu-demo`, code `1`, package `com.gbsschool.app`, minimum API 24. Label: PerfectEdu DEMO / TEST BUILD. The package name is retained to preserve the existing Android project.

SHA-256: `fa4be422ee26d313ce54db5f3dee987bc7c50b630d0463e664a0340b3e779c38`.

Keep the computer server running. Connect a phone by USB, enable/authorize debugging, and run `adb reverse tcp:5178 tcp:5178`. Use the emulator option only for an emulator. The embedded full Web workspace uses the same school-aware Web app and its own school login.

## Remaining work

Production Web Firebase and release Android retain their existing configured school. Production school lookup, platform authority, school onboarding, password reset and membership provisioning still require implementation and emulator/live verification. Supplied UDISE cannot silently fall through to the old production single-school login.

Preserve the existing production membership schema `schools/{schoolId}/members/{uid}` rather than introducing a competing permission collection. A production UDISE directory needs backend-enforced uniqueness and platform-only writes. Storage files, reports, jobs and audit logs must use verified tenant scope. Provider secrets belong in backend-only secret storage, never readable school settings or browser bundles.

Before public release: verified GBS UDISE, approved platform-owner bootstrap, Firebase multi-school auth/onboarding/reset, Firestore/Storage rollback and security tests, full production Web/Android parity, scale tests and domain deployment.

External API requirements: official SMS, WhatsApp, OTP, automated voice delivery and unattended dispatch. Existing native composers/dialer are fallbacks, not proof of message delivery or completed calls.

Physical tests remaining: installation, two-school phone login/sync, file/camera import, printing/PDF, dialer/SMS/WhatsApp, audio sharing and Android lifecycle behavior.

**Final production release ready: NO.**
