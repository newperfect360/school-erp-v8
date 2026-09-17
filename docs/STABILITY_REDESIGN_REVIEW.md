# School ERP — stabilization and redesign review

Date: 16 September 2026

## Open locally

- React school workspace: http://127.0.0.1:5173
- Original ERP: http://127.0.0.1:5174
- Production-build preview: http://127.0.0.1:4173
- React demo login: `admin` / `123456`.

Browser storage is specific to the hostname and port. These versions retain separate stores; this work does not migrate, merge, delete or replace existing user data. Automated tests use isolated browser contexts, not the user's browser profile.

## Design

Fresh split-layout login, deep teal navigation, ivory accents, grouped scrollable sidebar, compact school header, four primary metrics, attendance visualization, module shortcuts and recent academic records. Student and teacher entry forms now use labelled grids instead of layout tables. Other forms, tables, empty states, feedback notifications and print styles use the same visual system. Phone navigation uses a drawer; desktop and tablet layouts adapt to available width. Reduced-motion preferences are respected.

The original HTML ERP also has a matching responsive theme. Existing screens and controls remain available.

## Fixed and checked

- Student, teacher, homework and classwork records survive navigation and reload.
- Settings reload correctly and update the React school header after saving.
- Required-field, duplicate GR, numeric mobile/Aadhaar and teacher email checks.
- Failed storage writes retain form contents. Unreadable stored data is not silently overwritten.
- Image type/size validation, asynchronous image loading and file-input reset after successful saves.
- Attendance is stored by date; original ERP reloads saved statuses and prevents saving an outdated class/date list over other records.
- Original sample imports preserve existing students and avoid repeated duplicates.
- Original documents table renders saved records; selection fields retain selected students.
- Original marks and fee validation, empty-record guards, settings reload and invalid backup handling.
- Original table/report output escapes entered markup; user passwords are masked in table output.
- QR images are generated locally; certificate/ID rendering no longer depends on a third-party image endpoint.
- The existing Excel export library is served locally. Its pre-existing pinned version is retained.
- API method/body validation, preflight, provider error status propagation, timeout handling and removal of secret-bearing error URLs.
- Arbitrary outbound proxy URLs are restricted to server-configured HTTPS origins.

## Verification

- React production build: passed.
- Nine Edge browser regression scenarios: passed on development and production preview builds.
- Four Node API tests: passed. Provider responses are mocked; no real recipient is contacted.
- Browser coverage: valid/invalid login, all current navigation entries, logout, phone/tablet widths (390, 768 and 1024), record persistence, duplicate validation, delete cancellation, settings, date-separated attendance, corrupt storage, local QR images, print callbacks, message URL construction, original module forms, original results/fees/certificates, backup download, Excel download, invalid restore, verification hash handling and markup escaping.
- Console/page errors are asserted absent in navigation regression scenarios.
- React npm dependency audit: zero reported vulnerabilities at the time checked. This audit does not cover vendored legacy libraries or external services.

## Important limits — this is not a production-readiness certification

- React login is the pre-existing client-side demo credential check. There is no server authentication, authorization or role enforcement.
- No live database is wired into the React app. The root Firebase configuration file exists, but saving configuration alone does not establish a tested Firestore CRUD connection. No cloud database was changed or deleted.
- React Results remains a sample screen; its unavailable add action is visibly disabled. React Reports remains a sample preview and now says so. Implementing these missing business flows would exceed the request not to add business features.
- Certificates/ID QR encode supplied details. They do not provide trusted server-backed verification. Original Student 360 verification reads records from the current browser's storage, not from a cross-device service.
- Messaging links and proxy error handling are checked. Real WhatsApp/SMS delivery, provider accounts and delivery receipts are not verified. Bulk browser popups depend on browser permissions.
- Additional modules and UI edits appeared in the shared workspace while work was underway. Existing modules were preserved; navigation coverage is broader than full business-flow coverage for those modules.
- Oxlint could not run: Windows Application Control blocks its installed native binding. An attempt to use the package's documented-in-code WASM fallback failed because that matching package was unavailable in the registry. No OS policy was changed and this check is not claimed as passed.
- Public deployment has not been performed. Local servers are bound to `127.0.0.1`.

## Restart and test

Run from the repository root:

```powershell
npm run dev
npm test
```

In a second terminal:

```powershell
cd school-erp-pro
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

With both local servers running, use another terminal in `school-erp-pro`:

```powershell
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

For custom messaging providers, configure `MESSAGE_PROVIDER_ORIGINS` and/or `SMS_GATEWAY_ORIGINS` on the server as comma-separated HTTPS origins. No secret values belong in these allowlists. The default WhatsApp proxy origin remains `https://whatsbot.tech`.

Screenshots are saved under `school-erp-pro/artifacts/`. No public deployment, database deletion or outbound message sending was performed.
