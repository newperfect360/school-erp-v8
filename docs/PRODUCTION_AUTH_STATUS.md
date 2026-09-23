# Production authentication preparation — 20 September 2026

## Current authoritative status: bootstrap applied

See [PRODUCTION_BOOTSTRAP_RESULT.md](PRODUCTION_BOOTSTRAP_RESULT.md). Under subsequent explicit approval, the tested legacy-compatible activation rules were deployed and the verified existing UID received its gbs-school SUPER_ADMIN membership. All 13 legacy documents are unchanged. Work stopped when the actual live Vercel page still reported missing sign-in configuration. Prior statements below that no membership/rules were applied describe earlier checkpoints and are superseded. Real Web/Android login and synchronization remain unverified.

## Latest clean-setup decision

The owner approved `gbs-school` and identified the legacy records as trial data, then selected **Keep all production writes paused** at the membership-security gate. See [CLEAN_PRODUCTION_SETUP_STATUS.md](CLEAN_PRODUCTION_SETUP_STATUS.md). Web/Android tenant configuration is prepared locally and the web build passes; no production tenant, membership, cleanup or rules deployment has occurred. Earlier tenant-ID questions are superseded by this approval.

## 23 September safety activation update

See [SAFE_PRODUCTION_ACTIVATION.md](SAFE_PRODUCTION_ACTIVATION.md) for the latest read-only inventory, private backup, migration blockers and manual information needed. Existing administrator UID reverified; 13 legacy documents preserved and backed up. Complete current emulator suite: 12 PASS, 0 FAIL. Tenant ID is pending the owner's response. No production membership, rules or passwords changed. Live Web/Android login and synchronization remain unverified; this is not production activation.

## Live configuration check — 21 September 2026

### Latest deployment safety preflight

STOP before deployment: the existing enabled Email/Password account resolves to UID `F2k0InkD73eV9bDjXRNzl1Bw34j1`. Production has root collections `students`, `teachers`, `attendance`, and `notices`, but no `schools` membership documents. The prepared school-scoped rules explicitly deny the legacy root paths. Deploying them unchanged would break legacy access. No production role record was created under the current unrestricted rules because any authenticated user could modify it.

Fresh rollback backup: ignored local file `school-erp-pro/backend/production-rules-preflight-backup.local`, including current release metadata and complete rule source. Current ruleset: `projects/school-managment-8c102/rulesets/9031e5b4-4e58-4781-9098-4ce5848e18ab`. Current live rules still allow all authenticated reads/writes; this security issue remains unresolved, not approved for production use.

Six targeted emulator tests PASS: Firebase browser authentication/recovery/change/logout/timeout; canonical SUPER_ADMIN; student read/add/edit and audited soft deletion; attendance; teacher records; settings; certificate/result records; membership permission updates; Teacher/Office Staff denial of protected writes and Super Admin modification. Physical deletion is intentionally denied. Certificate/result record access does not prove full template/report application workflows. No production password was used, changed or recorded. The expanded test is `school-erp-pro/backend/tests/shared-data.test.mjs`.

The broader isolated browser audit also passed after correcting its obsolete menu list: actual portal navigation, Student add/edit/archive/restore, Excel template download, xlsx/xls/csv imports and mobile page rendering. Results: `docs/RELEASE_QA_MODULE_RENDER_RESULTS.json`. Android compilation/lint passed; real Android login and operational data synchronization remain unverified.

Manual Console inspection (no Publish or record edits yet): open Firebase Console, select `school-managment-8c102`, then Authentication > Users, find the supplied administrator email and verify the UID above. Open Firestore Database > Data and confirm which existing school records belong to this school. Open Firestore Database > Rules to inspect the currently published rules. Do not create a duplicate user or change the password. A school tenant identifier and an access-preserving legacy migration/compatibility plan are required before protected membership provisioning and rollout; Console account creation alone cannot solve that code/data-path mismatch.

Production status: UID identified PASS; UID membership configured FAIL; SUPER_ADMIN role provisioned FAIL; isolated emulator security tests PASS (scope above); rules deployed FAIL (withheld); real Web login FAIL (unverified); real Android login FAIL (unverified); legacy access affected NO because nothing was deployed (would be affected by the current candidate). No school records were changed or deleted.

### First Super Admin setup: awaiting production rules approval

The user-designated email was found in the existing Firebase Auth project. Its account is enabled and has the password provider. No duplicate account was created and no password, hash or reset token was printed or stored. No reset email has been sent during this setup attempt.

Live Firestore has no documents/missing parent documents under `schools`. Existing live rules allow all reads/writes to any authenticated account. A private local backup was saved at `school-erp-pro/backend/production-rules-backup.local`. Creating an administrator membership under those rules would allow other authenticated users to tamper with it, so membership provisioning has not proceeded.

Prepared canonical `SUPER_ADMIN` support in Firestore/Storage rules, web session role display, member management, web repository and Android repository. Existing `Super Admin` role values remain supported. Five isolated emulator tests passed, including canonical administrator access, prevention of client-created administrator memberships, login, password recovery/change, logout, timeout and data authorization.

The attempted `firebase deploy --only firestore:rules --project school-managment-8c102` was rejected by automatic approval review before execution. Reason: production-wide restrictive rules could lock out existing users or disrupt access; emulator tests do not establish safe live schema/membership rollout. No production rules or user memberships were changed. Explicit rollout approval/live compatibility review is needed before retrying. Prepared rules are `school-erp-pro/backend/firestore.rules`; they deny legacy paths outside the school-scoped structure. This availability impact must be reviewed, not hidden.

Current real-account results: Web login NOT TESTED; Android login NOT TESTED; Super Admin role NOT ASSIGNED; Forgot Password real delivery NOT TESTED. These are separate from passing emulator tests.

- Firebase CLI authorization succeeded. Existing project `school-managment-8c102` is ACTIVE; its default Firestore database exists in `asia-south1`. No new project/database was created.
- Read the live Identity Toolkit configuration: Email authentication is enabled. The provider accepts email/password; existing email-link support was not disabled.
- Added `school-erp-v8.vercel.app` to authorized domains, preserving all existing domains, and verified the update.
- Registered the existing Android package `com.gbsschool.app` in this same project. Android app ID: `1:288441699527:android:4a808addb16fb6060b82e2`.
- Downloaded the official Android client config to ignored `android-app/GBSSCHOOL/app/google-services.json` and existing web client config to ignored `school-erp-pro/.firebase-web-config.local`. These contain public client configuration, not administrator credentials. They do not by themselves activate runtime environment variables, membership or shared operational data.
- The user-designated Super Admin email has now been resolved to the existing UID above. No Auth account, password or membership was created/changed, and no reset email was sent.
- Web runtime environment, school tenant membership, deployed rules, Vercel deployment and configured APK still need completion and real verification. The sign-in configuration warning remains intentionally in place.
- Same-project registration is verified; real web/Android login and shared-data synchronization are NOT verified. Operational modules still need shared-repository integration as described below.

The remaining sections describe the earlier local implementation and its tests; they are not evidence of successful live activation.

Status: implemented and locally tested; NOT activated or deployed for live use.

## Changes

- `school-erp-pro/src/pages/SchoolLogin.jsx`: removes the fixed-password login and testing notice. Email/password Firebase sign-in, Show/Hide, Forgot Password and reset-link handling. No public self-registration or default administrator credential.
- `school-erp-pro/src/backend/productionAuth.js`: Firebase sign-in, session persistence, reset requests, reset-code verification, reauthenticated password changes and logout after password change. New passwords require 12–128 characters in the UI; configure the same or stronger Firebase server policy. Passwords are not written into school records, logs or browser storage by application code.
- `school-erp-pro/src/backend/useSchoolSession.js`: online membership verification, active/password-setup gates, permission updates, 15-minute web inactivity timeout and eight-hour client session limit. Firebase owns password hashing/storage and authentication throttling; client timers are not server token-revocation controls.
- `school-erp-pro/src/backend/firebaseClient.js`: prevents emulator authentication in production builds.
- `school-erp-pro/src/App.jsx`, `src/design/PortalShell.jsx`, and `src/pages/PortalHome.jsx`: remove selectable role impersonation. Navigation and home quick-action/metric visibility use server membership module grants; account security remains available to authenticated members. School settings/year source retained.
- `school-erp-pro/src/pages/AccountSecurity.jsx`: Change Password and assigned permissions.
- `school-erp-pro/src/components/MemberPermissions.jsx`: Admin/Super Admin can edit existing staff membership roles, active state and grants. Main Super Admin and self-edits excluded. Account creation and password-setup activation are not exposed to clients.
- `school-erp-pro/backend/firestore.rules`, `storage.rules`: require password setup and resource grants, preserve class/student scopes, constrain membership updates and prohibit client-created memberships. Rules are tested locally, not deployed.
- `school-erp-pro/src/backend/firebaseRepository.js`: optional SDK injection fixes the separate test-package SDK instance mismatch; runtime uses its existing Firebase SDK.
- `android-app/GBSSCHOOL/app/src/main/java/com/gbsschool/app/feature/auth/ProductionSignIn.kt`: native Firebase sign-in, school membership verification, recovery email, reauthenticated password change, logout and conservative 15-minute session expiry. No unsigned preview-dashboard entry.
- `android-app/GBSSCHOOL/app/src/main/java/com/gbsschool/app/navigation/SchoolApp.kt`: connects native authentication entry. Existing dashboard/module source retained; authenticated school-data screens still require repository integration.
- `android-app/GBSSCHOOL/app/build.gradle.kts`: accepts public `SCHOOL_TENANT_ID`, alongside the app's own `google-services.json` from the same approved Firebase project as web.
- Tests: `school-erp-pro/tests/production-login.spec.js`, `backend/tests/production-auth.test.mjs`, updated `backend/tests/shared-data.test.mjs`, and `android-app/GBSSCHOOL/app/src/test/java/com/gbsschool/app/ProductionLoginTest.kt`. Backend test script serialized to avoid clearing another suite's emulator state.

## Verified

- Web production build passes.
- Three desktop/mobile browser tests pass: configuration fails closed, Show/Hide, recovery/reset views, no role-preview selector and no horizontal overflow.
- Seven emulator tests pass. Authentication test exercises a disposable Super Admin account, module hiding, staff grant update, denied self-escalation, password change, reset-email code redemption, logout, inactivity timeout, mobile sign-in and membership deactivation. Repository tests verify school/class boundaries and record integrity.
- Android Kotlin compilation passes; Robolectric login test verifies that an unconfigured APK cannot sign in or bypass to the demo dashboard. Password visibility control works.
- Lint has no errors; seven existing unrelated warnings.
- Actual local login opened in Edge at http://127.0.0.1:5193/. This port is a review origin, not the owner's existing local data origin.
- No real password captured or displayed. No school records, official logo/configuration or templates deleted. Prior backup changes preserved.

## Activation required

1. Confirm Firebase project, school tenant document ID, and the existing Super Admin Auth UID/email. The old fixed `admin` check was not evidence of an existing Firebase account. No live account was created, replaced, reset or deleted.
2. In that project's Firebase Authentication settings, enable Email/Password, set a required server password policy (at least 12 characters), enable email-enumeration protection, configure recovery email delivery and authorized web domains. Firebase provides failed-attempt protections; live provider settings and quota behavior remain unverified.
3. Use a trusted administrator/backend process to preserve the existing UID and require its owner to set a secure password through Firebase recovery. Keep `passwordSetupComplete: false` until setup is confirmed. Clients cannot set this flag. There is no completed automated bootstrap/reset-completion service yet.
4. Provision `schools/{schoolId}/members/{uid}` with verified role, `active`, `passwordSetupComplete`, explicit `modules`, backend `resources`, `classIds`, and `studentIds`. Admin grants cannot exceed the grantor's grants. Supported roles include Super Admin, Admin, Headmaster, Teacher, Class/Subject Teacher, Clerk/Office Staff and specialist staff. Back-end class scopes still apply.
5. Populate the public web identifiers from `.env.shared-example`; do not put service-account secrets in VITE variables. Register `com.gbsschool.app` in the SAME Firebase project, supply its Android configuration and set the same school tenant ID. Do not copy the web app's registration into Android.
6. Deploy validated rules and web configuration together, then build/sign the configured Android app. No Vercel deployment or APK replacement has been performed in this task.
7. Verify the actual Super Admin and each staff role, real recovery-email delivery, provider throttling and native Android/web sign-in using the same account. No native cross-client live test has passed yet.

## Remaining production limits

The React operational modules still read browser-local records. Authentication/navigation gates do not turn those records into server-protected, per-user cloud data. Connect the existing modules to the shared repository and migrate reviewed data before real multi-user production use. Android currently exposes authenticated account security/permissions; its old demonstration dashboard is not a production school-data dashboard.

Existing browser and Android tests which specifically rely on the removed review-login or unsigned preview-dashboard flow need migration; they must not be used as evidence that production CRUD or Android business modules passed. The existing APK/download screenshots still describe the previous test build and have not been replaced.

No claim of live production readiness, real Super Admin access or web/Android data synchronization is made.

Provider references: https://firebase.google.com/docs/auth/web/password-auth and https://firebase.google.com/docs/auth/web/manage-users
