# Official school identity correction — 18 September 2026

The actual React ERP, older web entry, current document renderer and Android application now use the supplied Marathi identity. No alternative English spelling was invented. English institution/school/address fields are available but blank pending approved wording.

## Central source

`assets/school-identity.json` contains institution and school names in Marathi/English, address in Marathi/English, logo, academic year, school code, UDISE, contact number, email and website. Unknown identifiers/contact details remain blank. React reads this source through `src/services/schoolIdentity.js`. Existing Settings controls remain editable and feed all React pages/print contexts.

For a future official identity correction, edit this JSON, update `identityRevision`, and run `node scripts/sync-school-identity.mjs`. The command generates the older web configuration, Android resources and legacy settings templates. Rebuild Android to update the installed app. Web and Android do not currently share a live database.

The existing `assets/school-logo.jpg` is the supplied artwork used here. It was not redrawn, recoloured, cropped or edited. The Android copy is byte-identical; browser/print sizing uses containment to preserve aspect ratio. No separate new logo or photographed letterhead was present in this turn's attachment, so the specified institution–school–address hierarchy was applied directly.

## Saved information and historical records

On first load of the new identity revision, readable prior identity settings are backed up under a revision-labelled key before names/address/logo are corrected. Student data and unrelated settings such as school code, UDISE, contact information and custom fields are retained. Corrupt or unavailable storage is not overwritten. English identity fields from an unapproved prior revision are cleared rather than inventing a translation.

Current document rendering uses the central letterhead even with a saved custom document template. Template bodies remain intact. Already issued document snapshots, old review screenshots/PDFs and exact settings backups are historical records and are not silently rewritten. The source audit excludes those historical artifacts, dependency/build caches and external browser storage; it does not claim to rewrite every old binary in Git history.

## Changed/new files and purposes

All paths are relative to the workspace root.

| File | Purpose |
|---|---|
| `assets/school-identity.json` | Single editable official identity source. |
| `assets/school-identity.js` | Generated configuration for the older web app. |
| `assets/school-identity-runtime.js` | Correct legacy saved identity safely; populate legacy header, browser title and supplied logo. |
| `scripts/sync-school-identity.mjs` | Generate web/Android/template identity resources; copy original logo without modifying bytes. |
| `scripts/audit-school-identity.mjs` | Scan current text source for known incorrect variants; verify identical logo files; write audit evidence. |
| `school-erp-pro/src/services/schoolIdentity.js` | Central resolver, legacy aliases, official logo and one-time backed-up settings correction. |
| `school-erp-pro/src/storage.js` | Resolve school settings centrally on reads/writes. |
| `school-erp-pro/src/main.jsx` | Initialize identity correction and official browser title. |
| `school-erp-pro/src/App.jsx` | Remove duplicated hard-coded school defaults. |
| `school-erp-pro/src/pages/Settings.jsx` | Central defaults, multiline institution name, English identity fields and contact number. |
| `school-erp-pro/src/design/SchoolUI.jsx` | Use the supplied official logo; remove generated crest fallback. |
| `school-erp-pro/src/design/PortalShell.jsx` | Complete institution hierarchy in header/footer. |
| `school-erp-pro/src/design/school-portal.css` | Centered hierarchy, multiline institution and undistorted logo sizing. |
| `school-erp-pro/src/pages/SchoolLogin.jsx` | Official institution, school name and address on Login. |
| `school-erp-pro/src/pages/DownloadApp.jsx` | Official identity on download page and footer; remove provisional-logo wording. |
| `school-erp-pro/src/services/templates.js` | Central institution/school/address/logo letterhead for all 23 document types, including ID, Bonafide, LC, marksheet, progress/annual result, admission, consent/trip, sports/achievement, notices and circulars. |
| `school-erp-pro/src/pages/Reports.jsx` | Add central official letterhead to printable reports. |
| `school-erp-pro/tests/official-identity.spec.js` | Settings migration, exact Marathi values, original logo bytes, real pages, 23 print formats, PDF evidence, mobile/download identity and legacy header tests. |
| `index.html` | Load central legacy identity scripts; remove duplicated header literals. |
| `app.js` | Central legacy Settings/certificate identity and contained logo. |
| `patch/sprint1-student-master-tc-qr.js` | Replace hard-coded school name with central identity. |
| `patch/v33-header-templates-addon.js` | Central names/address and logo in older header/letterhead. |
| `patch/v34-master-production-addon.js` | Central settings resolver and official legacy letterhead. |
| `templates/master-templates-addon.js` | Reference central names/address rather than duplicate text. |
| `templates/master-settings.json` | Regenerated official settings template. |
| `templates/v33-settings.json` | Regenerated official settings template. |
| `templates/v34-settings.json` | Regenerated official settings template. |
| `android-app/GBSSCHOOL/app/src/main/res/values/strings.xml` | Generated full Marathi launcher label, institution, school, address and configuration fields. |
| `android-app/GBSSCHOOL/app/src/main/res/drawable-nodpi/official_school_logo.jpg` | Byte-identical original logo for Android. |
| `android-app/GBSSCHOOL/app/src/main/res/drawable/official_launcher.xml` | Supplied logo in a safe launcher inset. |
| `android-app/GBSSCHOOL/app/src/main/res/drawable/official_splash.xml` | White launch background with original logo. |
| `android-app/GBSSCHOOL/app/src/main/res/mipmap-anydpi/ic_launcher.xml` | Original logo for pre-adaptive launcher icons. |
| `android-app/GBSSCHOOL/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | Original logo for adaptive launcher icons; remove invented monochrome crest. |
| `android-app/GBSSCHOOL/app/src/main/res/values/themes.xml` | Official launch background. |
| `android-app/GBSSCHOOL/app/src/main/res/values-v31/themes.xml` | Android 12+ official system splash icon/background. |
| `android-app/GBSSCHOOL/app/src/main/java/com/gbsschool/app/core/designsystem/SchoolComponents.kt` | Shared Android school header reads generated resources; image uses ContentScale.Fit. |
| `android-app/GBSSCHOOL/app/src/main/java/com/gbsschool/app/feature/dashboard/DashboardScreen.kt` | Full official footer identity and header layout that retains Exit control. |
| `android-app/GBSSCHOOL/app/src/test/java/com/gbsschool/app/SchoolUiTest.kt` | Verify official resource text and capture splash drawable, Login and Dashboard. |
| `android-app/GBSSCHOOL/README.md` | Remove abbreviated school label from document heading. |
| `docs/PLAY_STORE_PREPARATION.md` | Describe official generated launcher label. |
| `releases/android/GBSSCHOOL-v1.0.0.apk` | Rebuilt local debug/test APK with corrected identity. Package identifier remains `com.gbsschool.app`. |
| `releases/android/release.json` | Updated artifact size/checksum/date. |
| `releases/android/login.png`, `releases/android/dashboard.png` | Updated actual Android previews used on the download page. |
| `android-app/GBSSCHOOL/artifacts/` | Refreshed native UI and splash-resource test captures. |
| `school-erp-pro/artifacts/official-identity/` | Requested web/Android previews, ID/Bonafide HTML and PDFs, gallery and source audit. |

## Verification and remaining limits

- Production web build passed; lint has zero errors and six existing Fast Refresh warnings. The bundle-size advisory remains.
- All 18 React service tests and nine root service/API tests passed.
- Both final identity browser tests passed (real React pages/documents/settings and the older web entry); the existing notice/gallery/settings browser test also passed. Mobile identity, report letterhead and preservation of unrelated stored fields were verified.
- Android `assembleDebug testDebugUnitTest lintDebug --offline` passed: five UI tests, zero failures. Login/Dashboard screenshots are actual Compose/Robolectric captures.
- The original logo and Android asset hashes match. The browser letterhead logo was compared byte-for-byte against the original image.
- All 23 current print formats contain the exact central Marathi institution/school/address. ID and Bonafide PDFs were generated using the browser print engine.
- Source audit found no known incorrect name variants in current text sources/configuration/templates/docs; the audit JSON records its exact scope and file count.
- Android splash preview is a render of the actual launch drawable, not a physical-device/system-launch capture. Physical Android device behaviour and production Firebase access were not tested or added.
- Certificate previews retain their existing draft/format-approval notice. Identity correction does not assert that the entire certificate legal format is approved.
- No deployment, messages, calls or unrelated module work was performed. Stop for user review.

Review: http://127.0.0.1:5186/artifacts/official-identity/index.html

Running web app: http://127.0.0.1:5186/
