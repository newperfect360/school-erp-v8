# GBSSCHOOL 1.0.0 test release review

Prepared 2026-09-17. **Not production-ready. No domain deployment, Play Store publication, database migration or live message sending was performed.**

## Deliverables

- Web project: `school-erp-pro/`; existing local school workflows retained.
- Independent Kotlin/Compose project: `android-app/GBSSCHOOL/`.
- Test APK: `releases/android/GBSSCHOOL-v1.0.0.apk`.
- Package `com.gbsschool.app`, version **1.0.0**, code **1**, min SDK **24**, target/compile SDK **36**.
- APK size **23,480,478 bytes** (22.4 MiB). Release date **2026-09-17**.
- SHA-256: `badb3afd16fb77766f32d8a9a36a86d83413e48aad72dd097022cd514c9a6224`.
- Public local route `/download-app`; review at `http://127.0.0.1:5186/download-app` while the development server runs.
- Download cards on Login and the school home sidebar; actual Compose screenshots, version, size, date, checksum and installation instructions. No student records or parent numbers are exposed on this page.
- APK remains outside source folders. Vite explicitly serves approved release filenames and copies them into `dist/downloads/android/` for a future deployment.
- Production QR deliberately pending an approved, deployed HTTPS domain. No localhost QR or invented official URL.

## FIXED / completed

- Raised Android version from 0.1.0 to 1.0.0 and built a debug-signed APK.
- Added the dedicated download route and visible desktop/mobile download entry points.
- Added exact-byte download/checksum validation and an unavailable-release state that removes the download button.
- Restricted development release serving to four explicit artifact names; arbitrary workspace files return 404.
- Corrected the release middleware startup hook after the first download test exposed a server integration error.
- Added large-phone enlarged-text navigation verification. The first run failed because the test looked for an uncomposed lazy-list item; scrolling the list to the item corrected the test. No Android UI defect was inferred from that failure.
- Verified the APK signature using Android `apksigner`, and package/version/SDK/launcher/permissions with `aapt`.
- Added reproducible artifact preparation: `node scripts/prepare-android-release.mjs` after a successful Android build/test and signature check.

## Verification and limits

| Area | Evidence | Result / limit |
|---|---|---|
| Web complete final suite | 39 Playwright tests | All passed together after release changes (3.6 minutes); includes all menu destinations, desktop/laptop/tablet/mobile, import/photo/identity mapping, contacts, years/lifecycle, fees, library, results/PDF, trip, backup and the two release tests below |
| Release page | 2 additional Playwright tests | Passed; actual download bytes and SHA-256 match, screenshots load, widths 1440/1024/768/390/360 fit, missing metadata disables download |
| Web service logic | 17 Node tests | Passed |
| Root communication/API logic | 9 Node tests | Passed; mocked/local boundary tests, no live provider delivery |
| Web lint | `npm run lint` | No errors; six existing Fast Refresh warnings |
| Web production bundle | `npm run build` | Passed; APK and metadata included; emitted APK hash equals source APK |
| Android build/lint | `assembleDebug testDebugUnitTest lintDebug --offline` | Passed using Android Studio JBR; tool access required execution outside filesystem sandbox |
| Android UI | 4 Robolectric/Compose tests, API 35 | Passed: Login notice, preview Dashboard/module notice, exit, compact 360×640, standard 411×915, large 480×1040 dp / 1440×3120 px with 150% text |
| Android lint advisory | `app/build/reports/lint-results-debug.html` | 0 errors, 13 advisory warnings; inspect dependency-version notices before a production upgrade |
| Signature | `apksigner verify --verbose --print-certs` | Verified v2 signature, **Android Debug** certificate; no release key supplied or overwritten |
| Device install / launch | `adb devices -l`, `emulator -list-avds` | No connected devices or configured AVDs. **Not verified on hardware/emulator**, including Samsung Galaxy S26 Ultra |
| Native functional modules | Source review | Students, Attendance and other dashboard entries currently display planned-module notices; no working native school data workflow |
| Backend | Source/config review | No authenticated shared backend connected to current React/Android apps; no live Firebase access or permission tests |

Screenshots: `school-erp-pro/artifacts/release/`, `android-app/GBSSCHOOL/artifacts/`. Robolectric screenshots are UI renderings, not proof of installation or device-system integration. API 36 is compiled/targeted; runtime tests above use API 35. Light theme is intentional; no dark theme is claimed.

## PENDING — implementation and device verification

- Native Students, Attendance, Homework, Results, Trip, Sports, Library, Certificates, Notifications and Profile workflows. Current APK remains the previously approved Login/Dashboard preview scope.
- Native phone dialer, SMS composer, WhatsApp fallback, audio sharing, QR scanner and camera/photo/file picker integration. These are **not implemented or tested in this APK**. Web device links are covered by browser tests, which do not prove telecom delivery or native-app launch.
- Android real login/OTP/logout and shared school repository synchronization. “Exit preview” is tested; it is not Firebase sign-out.
- On a connected authorised test device: install this APK, cold launch, rotate/background/restore, keyboard and large text checks, Android 16 system bars and OEM-specific behavior. Repeat functional checks after the modules exist.
- Server-enforced tenant/role/class permissions, immutable audit trails, concurrent updates, managed storage, version history and scheduled backups. Client role preview is not an access-control boundary.
- Browser backup restores structured records; binary IndexedDB attachments require a separate export/restore workflow. Do not treat existing JSON backup as a complete disaster-recovery backup.
- Existing student archive/lifecycle preserves identity/history and is tested locally; permanent deletion must remain a future audited privileged server workflow.
- Marathi suggestions are limited and require review; they are not a general translation service.
- Production QR, approved school branding, privacy/terms/support details and AAB signing.

## FIREBASE SETUP REQUIRED

The legacy root web configuration names `school-managment-8c102`. Its existence does **not** approve it as the staging backend for this release. It was not modified or contacted. The prior answer “2” does not identify the approved project or sign-in method.

Android `app/google-services.json` is absent. Firebase Auth/Firestore/Storage/Messaging dependencies and an injection boundary exist, but `SchoolApplication` does not initialize Firebase; the automatic initialization provider is removed and messaging auto-init is disabled. Simply adding the JSON file will **not** complete authentication or activate the repository.

`school-erp-pro/backend/firestore.rules` and `storage.rules` are **deny-all drafts**, not deployed or tested live. They prevent accidental permissive scaffolding but do not constitute implemented tenant/role access. No security rules were deployed over existing rules.

Required next: approved staging project ID + email/password, phone OTP or both; Android registration for `com.gbsschool.app`; matching downloaded JSON; Auth providers and test identities; verified server memberships; emulator tests denying unauthenticated, cross-school, disabled-user and unauthorised role/class access. Register the testing certificate fingerprints only on the approved project:

- SHA-1: `8c064144d2ac86a4dd4a14d3dec6788850abed51`
- SHA-256: `2d25bcb4d11ace07e4a82b6b53e7beedaa72265b80dbf04be2f36c7413018e7c`

Certificate fingerprints are public verification data, not private signing keys. Production signing certificates will differ.

Reviewed tracked credential filenames and source private-key/service-account patterns: no matching tracked files found. This is a scoped source check, not a full historical secret audit. Firebase web API keys are project identifiers, not a substitute for authorization ([Firebase guidance](https://firebase.google.com/docs/projects/api-keys)). Android package/config matching follows the [Firebase Android configuration guidance](https://firebase.google.com/docs/android/google-services-plugin-and-file).

## API REQUIRED / EXTERNAL SERVICE REQUIRED

- Approved shared backend implementing the existing token-based contracts, import transactions, authorisation, attachment validation and immutable audit storage.
- WhatsApp/SMS delivery providers only for automatic sending; web manual composers remain available. No delivery status or telecom duration is inferred from opening a link.
- Audio hosting and authorised recipients for automated audio delivery; telephony integration remains provider-neutral and server-configured.
- FCM token registration tied to an authenticated school user, notification channels, consent/runtime permission and server delivery handling. Current messaging callbacks are placeholders.

## CREDENTIAL REQUIRED

- Approved Firebase client configuration and staging identity setup; never put service-account/provider secrets in the APK or `VITE_*` variables.
- Owner-managed release/upload signing key and secret-manager supplied passwords for a signed release/AAB. Existing debug key was reused; it was neither exported nor replaced.
- Approved production HTTPS domain and school support contact before publishing a download QR or store listing.

## Reproduce / handoff

1. In `android-app/GBSSCHOOL`, set process `JAVA_HOME` to Android Studio JBR and run `gradlew.bat assembleDebug testDebugUnitTest lintDebug` (use `--offline` when dependencies are cached).
2. Verify the generated APK using SDK `apksigner verify --verbose --print-certs` and `aapt dump badging`.
3. From repository root run `node scripts/prepare-android-release.mjs`; it validates expected package/version and copies APK, screenshots and checksum metadata.
4. In `school-erp-pro`, run `npm run build`. Serve `dist` with an SPA fallback for `/download-app`, exact static APK handling and no automatic download/redirect. Do not deploy until approved.
5. On a connected approved device, `adb install -r releases/android/GBSSCHOOL-v1.0.0.apk`, then `adb shell am start -n com.gbsschool.app/.MainActivity`. If another signature is installed, do not uninstall or erase its data automatically.

**Stop after review. Production release is blocked by the explicit implementation and external setup items above.**
