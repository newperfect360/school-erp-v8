# Live setup without a custom domain — 18 September 2026

**The requested fully live school system is not complete.** The existing Vercel address is sufficient; a custom domain is not a prerequisite. No domain was purchased/configured, school records migrated, cloud settings changed, credentials reset, or images generated in this work.

## Requested status report

| Item | Verified status |
| --- | --- |
| LIVE URL | https://school-erp-v8.vercel.app |
| BACKEND STATUS | Pending integration. Current pages use browser-local persistence. Shared repository code exists but is inactive. |
| DATABASE STATUS | Read-only Firebase CLI check succeeded: `projects/school-managment-8c102/databases/(default)`, native Firestore, `asia-south1`. Its existence does not mean the app is connected or its schema/rules are ready. |
| WEB + ANDROID DATA SYNC | Pending. Firebase lists one WEB app named `school` and no Android app in this project. Android remains a preview app. |
| EXCEL IMPORT | Actual Vercel XLSX upload/validation/confirmation and template download passed again. Records currently remain in that browser. Existing photo-folder matching and Marathi preview are not yet cloud-integrated. |
| STUDENT ADD/DELETE | Actual Vercel Add, safe Delete/archive, Restore, Archive, class/division and academic-year workflows passed in isolated browser storage. No central persistence yet. |
| AUTHENTICATION | Pending production authentication. Existing preview login remains; Firebase login, OTP, password recovery and server-owned roles are not wired into actual screens. |
| FIREBASE / CLOUD | Existing Firestore and WEB registration verified read-only. Auth provider configuration, private Storage, Messaging delivery, complete rules and Android connection are not verified/activated. |
| BACKUP | Existing manual browser JSON backup/restore only. Daily cloud backups, file backups, recovery exercises and central audit/version history are pending. Browser export is not a complete cloud/file backup. |
| CUSTOM DOMAIN READINESS | Public URL configuration implemented and locally tested; no domain is required. Latest changes were not deployed in this turn. |
| PENDING ITEMS | Approved project/tenant and first Admin identity; auth/providers/roles; actual web repository integration and migration; Android registration/configuration/screens; private file storage; rules tests; cloud backups; full multi-device/live test matrix; deployment of prepared changes. |

## Changes made

- `school-erp-pro/src/config/siteUrls.js`: centralized public URL resolution, current-origin defaults, HTTPS validation and rejection of embedded URL credentials.
- `school-erp-pro/vite.config.js`: explicitly exposes only WEB_BASE_URL, API_BASE_URL, APP_DOWNLOAD_URL and PUBLIC_SITE_URL to the client as VITE_* values. Other server environment values are not forwarded.
- `school-erp-pro/.env.example`: documents those optional public variables.
- `school-erp-pro/src/pages/DownloadApp.jsx`: uses configured download/home links; removes the statement that an approved custom domain is required for a future production download QR. The current APK is still correctly identified as a test build.
- `school-erp-pro/src/backend/contracts.js`: optional API adapter base URL can use the central public API URL setting. This does not activate a backend or authentication.
- `school-erp-pro/service-tests/site-urls.test.mjs`: tests current Vercel defaults, future domain/API configuration, localhost and invalid URLs.
- `docs/LIVE_SETUP_WITHOUT_DOMAIN.md`: this implementation/activation record.

These are preparation changes, not a claim that all requested production functionality has been implemented. No JSX layout or styling redesign was performed.

## Public URL configuration

All four variables may remain empty. Defaults are derived from the browser's current origin, so both localhost and the existing Vercel subdomain work without a hard-coded production hostname.

| Variable | Default / meaning |
| --- | --- |
| WEB_BASE_URL | Current origin; school portal/home link |
| PUBLIC_SITE_URL | WEB_BASE_URL; public download destination origin |
| API_BASE_URL | `/api` on WEB_BASE_URL; endpoint location only, not proof of a working school API |
| APP_DOWNLOAD_URL | `/download-app` on PUBLIC_SITE_URL |

Set these in Vercel environment settings and rebuild when changing public locations. VITE_* equivalents are also accepted. Keep Firebase project ID, school tenant ID and record IDs unchanged during any future domain migration. Android backend configuration and Firebase authorized-domain settings must be reviewed separately; URL variables cannot activate those services automatically.

## Actual checks

- Production build passed.
- Lint passed with zero errors and seven warnings (six component-export warnings and one existing test-regex warning).
- Three URL configuration tests passed.
- Production-preview download navigation and unavailable-release handling passed; the image-producing download test was not run.
- Actual Vercel Student/Excel/year/class/division test passed: one test covering seven workflows. It used a fresh browser context and blocked outbound server mutations. No user's existing records were touched.
- Existing source-parity diagnosis remains documented separately. The new URL changes have not been deployed, so the current local JS bundle should not be claimed byte-identical to the earlier live bundle until deployment/reverification.
- Firebase demo-emulator verification again stalled downloading the Firestore binary and was stopped before tests executed. Draft backend rules remain unverified; they were not deployed.
- Full live Attendance/Results/Library/Fees/Trips/Parent Communication business-action tests and Web↔Android sync tests have not been completed by these checks.

## Information needed to activate the real school backend

The user has been asked to confirm whether `school-managment-8c102` is the intended live project, provide the first Admin's email address and confirm phone-SMS OTP. No passwords or service-account keys should be sent in chat. Firebase CLI can read this project's metadata; first-account setup must still be explicitly tied to the correct school and person.

After confirmation, the remaining implementation must:

1. Register `com.gbsschool.app` in that same Firebase project and obtain its public client configuration.
2. Enable the intended authentication providers, authorize the existing Vercel hostname, implement login/reset/OTP screens, and provision server-owned membership. Replace preview credentials/role selection when the verified flow is ready; do not treat UI role selection as authorization.
3. Pass rules tests before deployment, including all requested roles, cross-school/class denial, disabled users, student-parent mapping, files, version conflicts and audits.
4. Integrate actual page reads/writes with central repositories. Plan and review local-data migration without overwriting or silently uploading records. Preserve dirty forms and import batch integrity.
5. Wire Android authentication/repositories/queue to real screens; test offline changes, reconnect and conflict review against the same records.
6. Configure private file storage and service-driven notifications. Browser call/WhatsApp/SMS composition is not proof of telecom delivery.
7. Configure daily database backups, separately protect uploaded files, and test restoration into an isolated recovery database before any production restore. Select retention and access policies with the school.
8. Deploy verified source to the existing Vercel project and run the entire requested live test matrix.

Firebase documents phone provider/domain setup in [Phone authentication](https://firebase.google.com/docs/auth/web/phone-auth). Its [scheduled backup documentation](https://firebase.google.com/docs/firestore/backups) describes daily/weekly schedules and restoring to a new database. Neither service has been enabled by merely adding configuration files here.
