# GBSSCHOOL 1.0.0 — test/debug APK

`GBSSCHOOL-v1.0.0.apk` is a **debug-signed Login and Dashboard UI preview**, not a production school application. Native student/attendance/communication workflows and Firebase sign-in are not implemented. Use sample data and do not enter real credentials.

Package: `com.gbsschool.app` · Version: 1.0.0 (1) · Android 7.0/API 24 or later.

`release.json` contains the exact byte count, SHA-256, build type and preparation date. `login.png` and `dashboard.png` are actual Compose UI test captures. No installation on an Android device has been verified yet.

The web project serves these artifacts at `/downloads/android/` and presents them at `/download-app`. Files are copied into the web production bundle at build time. Nothing has been deployed.

See [the release report](../../docs/RELEASE_PREPARATION.md) before testing. Future releases must use their own versioned APK names and updated metadata/asset allowlist; do not replace signing keys or erase existing installed-app data to force an update.
