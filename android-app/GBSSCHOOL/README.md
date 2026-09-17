# GBS School — Android milestone 1

Independent Kotlin + Jetpack Compose application. Open **this directory** in Android Studio. No web source, build setup, or data is imported or modified.

## Included

- Application ID and namespace: `com.gbsschool.app`; minimum Android 7.0 / API 24.
- Material 3 Login and Dashboard, school crest and vector campus illustration.
- Scrollable layouts, system-bar/keyboard insets, accessibility labels, and Compose previews.
- Debug-only **Explore preview dashboard** entry. All dashboard numbers are fictional fixtures. Sign-in validates empty fields but deliberately does not authenticate or send credentials.
- Dashboard shortcuts for Students, Attendance, Homework, Results, Educational Trip, Sports, Library, Certificates, Notifications and Profile show an honest next-phase notice.
- Firebase Authentication, Firestore, Storage and Messaging dependencies and integration boundaries. No Firebase app is initialized and notification auto-init is disabled.

OTP and the remaining module screens/business logic are intentionally deferred to the next approved milestone.

## Build and review

Use Android Studio's bundled JDK (Java 21) or another compatible JDK 17+. Install Android SDK 36. Set the SDK path through Android Studio or an ignored `local.properties` file:

```properties
sdk.dir=C\:/Users/YOUR_USER/AppData/Local/Android/Sdk
```

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest lintDebug
```

On macOS/Linux: `sh ./gradlew assembleDebug testDebugUnitTest lintDebug`.

Install `app/build/outputs/apk/debug/app-debug.apk`, then tap **Explore preview dashboard**. Release builds do not expose the preview entry. Android Studio also provides `LoginPreview` and `DashboardPreview`. Robolectric UI tests generate actual Compose renders in `artifacts/login.png` and `artifacts/dashboard.png` when run successfully.

## Structure

`core/designsystem`: theme and reusable school visuals. `feature/auth` and `feature/dashboard`: screen UI. `navigation`: first-milestone screen flow. `data`: repository contract and explicit sample data. `data/firebase`: future injected SDK boundary. `data/notifications`: messaging lifecycle integration point.

This is deliberately a small single-module application; feature packages can become modules as the application grows.

## Backend connection — later phase

1. Register the Android package in the **approved school's Firebase project**. Supply `app/google-services.json` locally (gitignored). The Google Services plugin is conditional so clean checkout builds without this file.
2. Implement explicit Firebase initialization, sign-in/OTP and server-authorized role/school membership before enabling authenticated navigation. Remove the deliberate initialization block in the manifest only during that integration.
3. Implement `SchoolRepository` against the existing backend's verified contract. Reuse stable school/student IDs and tenant boundaries; do not invent parallel collections or migrate web data in this milestone.
4. Add tenant-scoped Firestore/Storage security rules and emulator tests. Client-side role labels must never grant access. Register messaging tokens only against a verified user and school, revoke them at logout, and request notification permission contextually on Android 13+.
5. Keep admin credentials, service account keys and provider secrets on the server in secure environment configuration. Never embed them in Gradle, resources, `BuildConfig`, or the APK. The Firebase Android configuration is not an authorization boundary.

## Pinned toolchain

AGP 9.2.1, Gradle 9.4.1, built-in Kotlin / Compose compiler 2.3.10, compile/target SDK 36, Java 17 bytecode. Compose BOM 2025.08.01; Firebase BOM 34.2.0 (main modules, no retired KTX artifacts).

References: [AGP compatibility](https://developer.android.com/build/releases/agp-9-2-0-release-notes), [built-in Kotlin](https://developer.android.com/build/migrate-to-built-in-kotlin), [Compose BOM](https://developer.android.com/develop/ui/compose/bom), [Firebase Android setup](https://firebase.google.com/docs/android/setup).

## Verified on 17 September 2026

- `assembleDebug testDebugUnitTest lintDebug`: **BUILD SUCCESSFUL**.
- Three Robolectric UI tests passed: sign-in remains unconnected, preview/module/exit navigation works, and preview/exit remain reachable on a 360 × 640 dp phone.
- Actual UI renders reviewed at 411 × 915 dp: [design review](DESIGN_REVIEW.md).
- Lint: zero errors; 13 advisory warnings for newer SDK/dependency versions. Versions remain explicitly pinned.
- Merged manifest and APK metadata checked: `com.gbsschool.app`, min SDK 24, target SDK 36, no Firebase initialization provider, messaging auto-init disabled.
- No physical device/emulator was connected. Hardware behaviour and production backend integration have not been tested.
- Git comparison against the starting revision `aa6a61e3059a0ff16f9193355ddc71a5f0fae6d1` showed no changes outside `android-app`.
