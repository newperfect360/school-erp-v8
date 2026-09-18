# Future Play Store release packet — draft, not published

Current distribution is a debug UI preview. No signed production AAB is generated and no Play listing is submitted.

| Item | Prepared / outstanding |
|---|---|
| App name | Official Marathi school name (generated from assets/school-identity.json) |
| Application ID | `com.gbsschool.app` |
| Version | 1.0.0 / 1; increment code for subsequent store uploads |
| UI assets | Compose school crest, adaptive/legacy launcher icons and monochrome icon exist; approved school artwork still required |
| Splash | Existing platform launcher/theme behavior; custom branded splash and device review pending |
| Screenshots | Actual Login/Dashboard test captures in `releases/android/`; replace with device captures of the completed app for the listing |
| Short description draft | School learning and administration, connecting teachers and families. Use only when the real workflows are available. |
| Support | School must supply approved support email/phone/site; no fabricated contact |
| Privacy policy / Terms | Draft requirements below; school approval and hosted URLs pending |
| Signing | Debug certificate used for current APK only. Owner must establish upload key custody and Play App Signing; never commit a key/password |
| AAB | Future command `gradlew.bat bundleRelease`; requires approved signing configuration and backend/module completion before distribution |

## Privacy policy draft for school review

Operator: **[approved school legal name/address/support contact required]**.

The current test APK renders sample school data. It does not submit or store the Login form's credentials and has no connected authentication, student upload or messaging workflow. Do not provide real credentials or student data when testing this build. Firebase libraries are included but explicit initialization and messaging auto-init are disabled in the current app.

Before the connected release, document the actual data collected: account identity; school/student IDs; enrolment, contact and academic records; photos/documents; attendance/results; parent communications; and trip location only if that optional feature is implemented and authorised. Specify each purpose, processor, access role, retention period, deletion/archival constraint, backup behavior, user rights/request process, security controls and incident/support contact. Explain minors' data handling and school/guardian authorisation. Do not claim end-to-end encryption, complete deletion or telecom delivery without implementation evidence.

Publish the final policy on an approved HTTPS URL and link it in the app and listing. The template above is an implementation disclosure draft, not a completed legal policy.

## Terms draft for school review

Use only with authorised school access. Keep credentials private and verify recipient/student identity before communication. School staff remain responsible for reviewed records and official approvals. The current preview is for design testing, supplies sample information and must not be relied on for attendance, fees or emergency contact decisions. School must approve service availability, acceptable use, support, liability, governing terms and effective date before publication.

## Data Safety preparation

Do not preselect “no data collected” for the future app. Complete Play's questionnaire against the final executable and every SDK's actual behavior. Record collection/sharing, purpose, optionality, transit protection, retention/deletion and account-deletion paths for each implemented data category. Reassess Firebase configuration, crash/analytics libraries, third-party communications and location features before each release.

## Permission review

- Current manifest requests Internet and notifications; merged Firebase libraries add network state, wake lock, C2DM receive and Google services permissions. Notification permission is not currently requested at runtime and notifications are not functional.
- Dialer and SMS composer should use user-confirmed intents; do not add direct call, call-log, contact-book or SMS-reading permissions for these actions.
- Use system photo/file pickers where possible. Camera permission is needed only for a feature using direct camera access; denied/cancelled flows must be supported.
- Location permissions belong only to an implemented, explicit trip-location feature; background location is not currently present.
- Recheck the merged manifest for release and exercise permissions on API 24, modern Android and the actual target Samsung device.

Modern target SDK builds require real inset/device testing; see [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16). Current source uses edge-to-edge with Compose inset handling, but physical Android 16/Samsung testing remains pending.

## Release signing and approval

Keep release keystore outside the repository with recoverable owner-controlled custody. Inject signing path/alias/passwords through the CI secret manager or secure process environment; configure Gradle only after those inputs exist. Never place private signing or Firebase service-account secrets in an APK, screenshot, source file or browser environment variable. Verify the signed AAB/package/version and install a generated test APK before approval.

No deployment or publication is authorised by this document.
