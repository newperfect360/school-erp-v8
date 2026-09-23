# Clean production setup — paused at owner's request

The owner approved a clean tenant `gbs-school` and classified the 13 legacy operational documents as trial data, not migration candidates. Later in this task the owner selected **Keep all production writes paused** when presented with the unsafe membership bootstrap/rules ordering. That latest constraint controls production actions.

## Completed locally

- Fresh read-only backup of all 13 enumerated Firestore documents and published rules: `school-erp-pro/backend/production-backup-1790136170855.local`.
- SHA-256: `5f329249923e5f3d4e5718901e811ed9c8c73fe6ef3622b76d306ab6b7e82af4`. JSON readback verified; backup is Git ignored. Snapshot is paginated, not an atomic managed export or a backup of browser data/Storage objects.
- Added `shared/production-school.json`: existing Firebase project, default database, approved tenant, year 2026-27, Asia/Kolkata and editable timing defaults (Mon–Fri 07:30–12:30, Saturday 07:30–11:00, Sunday holiday).
- Added `SCHOOL_TENANT_ID=gbs-school` to Android Gradle configuration.
- Created ignored web `.env.local` from the existing official Firebase web client configuration. It selects the same existing project and tenant, with emulators disabled. No password or administrator secret was added.
- Verified Android google-services.json and web client configuration have the same Firebase project ID.
- Web production compilation PASS. This is not proof of production login, cloud CRUD or sync. Build remains local and includes the previous preview APK from the existing release-assets plugin; it must NOT be published as a fresh production Android release.
- Official school identity, logo, templates, ID-card format and all application source features remain intact.

## Production untouched

No tenant or membership created. No trial records deleted, moved, archived remotely or imported. No Auth account created or password changed. No Firestore/Storage rules published. No Vercel deployment and no fresh APK generated.

Current rules permit every authenticated user to modify every document, including a new membership. The proposed temporary membership protection was not prepared or published because the owner chose to pause production writes. Creating an unprotected SUPER_ADMIN membership is not represented as completed.

## Remaining production-critical work

Protected bootstrap and real private administrator login; clean tenant/settings creation; backup-verified trial cleanup; shared repository integration for every Web operational module; native Android operational screens; stable-ID/GR import enforcement against the server; additional collection schemas/rules; role normalization and all-role security tests; real-time cross-client verification; real notification provider/scheduler integration; production ID-card/report testing; fresh signed APK, device tests, release download gating and Vercel deployment.

Browser-local operational storage is still present; configuration changes alone do not remove it. Firebase does not materialize empty collections without documents, so no dummy students or placeholder collection records will be created merely to show collection names.

Production verification is FAIL/not performed for login, Android login, Super Admin, Student CRUD, Staff CRUD, Excel import, attendance, fees, notices, ID cards, reports, parent calling, notifications, both sync directions, logout, forgot password and unauthorized-access blocking. Previously passing isolated emulator tests are not live PASS results.

Live URL of record: https://school-erp-v8.vercel.app (not deployed or reverified in this task).
Fresh production APK: none. Tenant ID: gbs-school (configured locally, not provisioned).
Project: school-managment-8c102. Overall status: NOT production-ready; production writes paused.
