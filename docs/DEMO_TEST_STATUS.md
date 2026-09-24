# Demo / test build — 23 September 2026

Routes, APK version and multi-school behavior are superseded by [PerfectEdu architecture and test report](PERFECTEDU_ARCHITECTURE.md). School login is now `/login`; `/` is the public PerfectEdu entry.

Manual-test build available at http://127.0.0.1:5178/.
Development account: `dilippawar2207@gmail.com` / `admin1234`.
These are deliberately development-only credentials. Production builds exclude the development authentication implementation; the production JavaScript was checked for these credentials and contained neither value. No Firebase users, passwords, records, or security rules were changed or deployed.

## Shared data and Android connection

Web and the debug APK now use one computer-hosted demo service at `/__school_demo`. Operational data is stored in `school-erp-pro/.demo-data/school.json`, not separate browser/device databases. In-memory caches refresh from this server. Saves use conflict checks; individual account passwords use salted scrypt hashes. The previous successful file is retained as `school.json.previous`. This is a rolling recovery copy, not an independent off-computer backup; keep dated copies of the data directory before entering substantial real information.

The existing browser's operational records were not deleted or automatically migrated. Only existing school identity/configuration/templates are eligible for initial preservation into the shared store. Clearly marked TEST records created during verification remain available for inspection. Most regression fixtures ran on a separate QA file, `.demo-data/qa-only.json`, at port 5398.

This is a local development backend, not an activated Firebase production deployment. Keep the computer and Vite server running while using the debug APK.

1. Connect the Android phone by USB and enable Developer options → USB debugging.
2. Accept the phone's USB debugging authorization for this computer.
3. Run `C:\Users\PAWAR\AppData\Local\Android\Sdk\platform-tools\adb.exe reverse tcp:5178 tcp:5178`.
4. Install `C:\Users\PAWAR\Documents\GitHub\school-erp-v8\android-app\GBSSCHOOL\app\build\outputs\apk\debug\app-debug.apk`.
5. Open **GBSSCHOOL DEMO / TEST BUILD**, leave the emulator option off, and use the development account above. An Android emulator uses the emulator option instead.
6. Native operational screens share the server. The **Full Web workspace / Documents / Excel** button opens the existing Web application for document, import, template, and backup workflows. It requires a separate login in that WebView but uses the same accounts and data.

APK: `com.gbsschool.app`, version `1.0.0-demo-test`, version code `1`, minimum Android API 24.
SHA-256: `c500792d810d494737a194464d6109a3b1ae22775e75dbdbd84acca0361c4f5e`.
The local login-page download endpoint was verified to serve this exact APK.

## What changed

- Added persistent shared demo backend, users/permissions, class scoping, server-side password hashing, failed-login protection and atomic conflict-checked writes.
- Replaced development operational localStorage access with the shared storage adapter; production Firebase authentication remains separate.
- Added Web and native demo account administration with the requested role list, assignments, read/write module permissions, reset/disable/archive/restore actions. OTP delivery is not enabled.
- Replaced the native memory-only demo repository with the shared server adapter. Native attendance saves drafts and directs finalized corrections to the reviewed Web workflow.
- Added native SMS/WhatsApp composers and audio sharing alongside parent dialer actions; intent initiation never claims confirmed delivery or completed calls.
- Extended Excel column mapping/photo-filename matching and bilingual message templates, including Half Day and library messages.
- Fixed split UTF-8 request decoding, Windows file replacement contention, stale Web polling snapshots, and native cross-module version conflicts.
- Added debug-only full Web workspace, file chooser/export and print bridge. These device integrations are implemented but not physically verified.

## Evidence

- Visible Chrome review window submitted the account through the real login form at port 5178 and loaded `.portal-shell` with the development badge. It is a dedicated persistent Chrome review window, not the original tab. The original tab received repeated unintended `G` input during accessibility automation; its successful login is not claimed.
- 19 browser workflow tests passed: `demo-shared.spec.js` (1), `demo-workflows.spec.js` (11), `demo-import.spec.js` (4), `demo-lifecycle.spec.js` (3).
- 2 server tests passed: permissions, password hashing, persistence, duplicate GR checks, conflicts, UTF-8 network chunk regression.
- Android JVM/Robolectric suite: 10 passed, 1 skipped. Includes real demo-server login, native student/teacher workflows, and shared repository integration. The skipped Firebase-emulator interop test was not used as demo evidence.
- Web build passed; lint: no errors, 7 warnings. Android debug build and lint passed; Android lint has 29 warnings.
- `adb devices` reported no connected phone. No physical APK installation, dialer, actual SMS/WhatsApp delivery, audio sharing, file-picker, printing, or physical-device synchronization PASS is claimed.

## Workflow matrix

PASS is limited to the workflow described by the row. Android PASS below means native JVM/UI or repository testing against the real demo server, **not** physical-phone certification. PENDING includes untested and non-applicable combinations; it does not claim an implementation failure. Print/PDF includes actual user-facing output, so render-only previews do not earn PASS.

| Module / tested scope | Web | Android | Create | Edit | Delete | Save | Search | Sync | SMS | WhatsApp | Call | Print/PDF | Final Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Demo login / dashboard | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PASS |
| Users / permissions | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Student records | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PASS |
| Teacher records | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PASS |
| Office staff records | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Attendance drafts / reviewed correction | PASS | PASS | PASS | PASS | PENDING | PASS | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | PASS |
| Parent communication / follow-up | PASS | PASS | PASS | PASS | PENDING | PASS | PENDING | PENDING | PHYSICAL DEVICE TEST REQUIRED | PHYSICAL DEVICE TEST REQUIRED | PHYSICAL DEVICE TEST REQUIRED | PENDING | PHYSICAL DEVICE TEST REQUIRED |
| Fees / receipt validation / void | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING |
| Notices | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING |
| Academic year | PASS | PENDING | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Class / division | PASS | PENDING | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Promotion / leaving / restore | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Leaving Certificate issuance | PASS | PENDING | PASS | PENDING | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Results / correction / archive | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Library book master | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Sports equipment master | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Educational trips | PASS | PENDING | PASS | PASS | PASS | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Excel / photo import and export | PASS | PENDING | PASS | PASS | PENDING | PASS | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Backup merge / reports export | PASS | PENDING | PASS | PENDING | PENDING | PASS | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| All remaining document formats / ID cards | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| Every bilingual template / staff automation | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | API REQUIRED | API REQUIRED | PENDING | PENDING | PENDING |

## Synchronization result

Actual native repository code communicated with the same running port-5178 server as the Web client:

| Direction / record | Result |
|---|---|
| Web-created student → native repository | PASS |
| Native student edit → Web client | PASS |
| Web attendance draft → native repository | PASS |
| Native attendance draft edit → Web client | PASS |
| Web fee → native repository | PASS |
| Web notice → native repository | PASS |
| Every other module / both-direction lifecycle parity | PENDING |
| Physical phone ↔ Web | PHYSICAL DEVICE TEST REQUIRED |

## Remaining work

- Physical-phone installation and complete workflow verification, including native account administration and embedded Web file/print flows.
- Full regression of every supplied document's auto-fill, save, print/PDF; Bonafide, ID cards, admission/general-register and other templates are preserved, not newly certified by this test run.
- Full native CRUD and both-direction sync verification for all remaining modules, library loans/returns and sports issue/return workflows.
- Every role/assignment combination, user password-change/reset UI, all template edits and staff automation need additional end-to-end coverage.
- Official SMS, WhatsApp, OTP, unattended background dispatch and provider delivery receipts need service configuration. Manual composers require a compatible phone/app and user SEND action. Prepared jobs or opened composers are never reported as delivered messages.
- Scheduled dismissal preparation currently depends on the application being open. An always-running service is still needed for unattended dispatch while all apps are closed.

**DEMO READY: YES for local/manual review of login and basic data entry. Full requested workflow certification: PENDING. Production release ready: NO.**
