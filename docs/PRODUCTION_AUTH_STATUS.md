# Production authentication preparation — 20 September 2026

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
