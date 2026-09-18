# Local / Vercel source audit — 18 September 2026

**Historical audit — superseded by [current production verification](PRODUCTION_SOURCE_VERIFICATION.md).** Commit `493ffa28a3972fab65c401d22ad69b68fa2e8527` subsequently deployed the configuration fix through Git. The actual live HTML/JS/CSS and rendered layout now match localhost. The blocked-deployment status below describes the earlier check, not current production.

Status: diagnosis confirmed, local configuration fixed and production build verified. **Live deployment is blocked by Vercel authentication and has not been changed.**

## Requested source report

| Item | Verified result |
| --- | --- |
| LOCAL SOURCE | `C:\Users\PAWAR\Documents\GitHub\school-erp-v8\school-erp-pro` |
| VERCEL SOURCE | Live HTML matches repository-root `index.html` exactly after CRLF normalization; it loads root `app.js`, `style.css`, and `assets/legacy-theme.css`. It is the legacy frontend, not the React bundle. |
| LOCAL BRANCH | `main` |
| VERCEL BRANCH | Dashboard production-branch setting **not verified**: Vercel CLI requires login. GitHub confirms the deployed SHA, but its deployment ref is a SHA, not a branch name. Do not infer the configured branch from this. |
| LOCAL ENTRY FILE | `school-erp-pro/index.html` → `src/main.jsx` → `src/App.jsx` → `src/pages/PortalHome.jsx` after login |
| CURRENT PRODUCTION ENTRY FILE | Repository-root `index.html` → `app.js`. No App.jsx/main.jsx is included in the current live HTML. |
| VERIFIED REACT PRODUCTION ENTRY | `school-erp-pro/dist/index.html` → `assets/index-CeMij3Sk.js`, compiled from the same main.jsx/App.jsx as localhost |
| CURRENT VERCEL ROOT DIRECTORY | Dashboard value **not verified**. Observed published source is the repository-root legacy frontend. This observation is not a claim to have read the dashboard setting. |
| CURRENT VERCEL BUILD / OUTPUT SETTINGS | Dashboard overrides **not verified**. Before this fix root package.json had no build script and root vercel.json defined only rewrites, without build/output selection. |
| PREPARED ROOT DIRECTORY | Repository root `.`; keeps existing root API functions and shared assets available to the build |
| PREPARED INSTALL COMMAND | `npm --prefix school-erp-pro ci` |
| PREPARED BUILD COMMAND | `npm run build`, delegating to `npm --prefix school-erp-pro run build` |
| PREPARED OUTPUT DIRECTORY | `school-erp-pro/dist` |

## Exact reason for the design difference

There are two web entry points in one repository. The development Vite process runs the nested React educational portal. Vercel publishes the root legacy static application. The live source is not the newer React build. This is established by the live HTML comparison and screenshots, not a guess based on folder names.

Both the initial checkout and the observed successful production deployment use commit **`c87c7991e207bd23055471d892771296edf5f3d6`**. Therefore an older Git commit is not the explanation for this observed mismatch. The build-selection changes in this report are local working-tree changes, not yet deployed or committed.

Evidence:

- GitHub deployment ID `6516174223`, environment `Production – school-erp-v8`, successful at `2026-09-18T02:25:02Z`.
- [Deployment metadata](https://api.github.com/repos/newperfect360/school-erp-v8/deployments/6516174223) and [status](https://api.github.com/repos/newperfect360/school-erp-v8/deployments/6516174223/statuses).
- Deployment URL: `https://school-erp-v8-ayy7sybcq-perfect360.vercel.app`.
- Public alias: `https://school-erp-v8.vercel.app`.
- Live HTML equals root index.html after line-ending normalization, references app.js and contains no React entry/bundle.

At inspection, port 5178 had **no listener**. The existing React Vite process was PID 35792 on port 5186, whose command explicitly names school-erp-pro/node_modules/vite. A legacy server was on 5174. For this verification, the same React source was started on the requested **5178**, and Vite production preview on **4178**. These are different serving modes of the same React frontend, not separate UI implementations.

## Workspace inventory

- `school-erp-v8/`: repository; also contains the currently live legacy index.html/app.js and its modules, styles and server functions.
- `school-erp-pro/`: canonical React/Vite frontend, its source, tests and lockfile.
- `school-erp-pro/dist/`: generated production output, ignored by Git; not an independently maintained frontend.
- `school-erp-pro/artifacts/`: screenshots/review evidence; not production UI source.
- `android-app/GBSSCHOOL/`: independent native Gradle/Kotlin app, not a web deployment target.
- `android-app/GBSSCHOOL/artifacts/`: Android screenshots, not another app.
- `school-erp-pro/backend/`: inactive Firebase integration/rules test tools, not a frontend.
- `releases/android/`: release assets consumed by the existing download page.

No legacy source was removed: it is demonstrably still used by production. Deleting or moving it before the production switch would not satisfy the requirement to confirm it is unused. Root `npm run dev` now selects React; the old server is explicitly named `legacy:dev` for recovery until production switches.

## Routes and design

The React application uses state navigation in App.jsx rather than React Router. Portal navigation is defined in `src/design/portalNavigation.js`. `src/main.jsx` has the separate `/download-app` path. Student Master is Students.jsx/StudentDirectory.jsx; Excel import is StudentImport.jsx, opened through Student Master or the navigation menu.

No JSX, CSS, logo, school identity, database, Firebase rules, or student-data file was changed in this task. Routing through the existing API rewrite remains present. The deployment configuration publishes only the React build output rather than the repository-root legacy HTML.

## Verification

- Root `npm run build` passed and produced the same React bundle as building directly inside school-erp-pro.
- 149 menu destinations opened in development and 149 in production preview; zero page errors. These are navigation/render checks, not claims that every existing module implements all business features.
- `/download-app` rendered in both modes.
- Local and production-preview Home screenshots are **byte-identical** at 1440 px width, using fresh browser contexts and the same language. SHA-256: `a437fea7c7c5541e846659da6d9f83acde1870060f1695ae60cc806adc333695`.
- Student Master and Excel Import screenshots captured in both modes.
- Four existing implementation tests passed against the production preview: XLSX/photo import and edit/persistence; XLS import; CSV import; duplicate-photo/stale-data protection. Test records existed only in isolated test browser contexts, not the user's browser/database.
- Live screenshot confirms the old sidebar UI remains deployed. **Local/live parity is not yet achieved.**

Evidence is in `school-erp-pro/artifacts/deployment-parity/verification.json` and the adjacent PNG files. Review gallery: `http://127.0.0.1:5178/artifacts/deployment-parity/index.html`.

## Exact changed / added files

- `package.json`: default dev/build/preview delegate to canonical React app; explicit legacy recovery command.
- `vercel.json`: explicit install command, build command and React output directory; existing API/SPA rewrites retained.
- `.vercelignore` (new): omit Android sources and test/review folders from CLI upload; keep shared assets and released APK.
- `school-erp-pro/scripts/verify-deployment-parity.mjs` (new): isolated browser screenshot/navigation verification for local, preview and optionally live.
- `docs/LOCAL_VERCEL_SOURCE_AUDIT.md` (new): this evidence report.
- `school-erp-pro/artifacts/deployment-parity/index.html` (new): screenshot evidence gallery.
- `school-erp-pro/artifacts/deployment-parity/verification.json` (new): machine-readable observations and screenshot hashes.
- New screenshots in that directory: `local-home.png`, `local-students.png`, `local-excel-import.png`, `production-preview-home.png`, `production-preview-students.png`, `production-preview-excel-import.png`, `vercel-before-home.png`.
- Existing test-generated screenshots refreshed under `school-erp-pro/artifacts/implementation-proof/`: `excel-photo-preview.png`, `home-360.png`, `home-390.png`, `home-desktop.png`, `import-360.png`, `import-390.png`, `menu-360.png`, `menu-390.png`, `student-edit.png`, `student-master-imported.png`, `students-360.png`, `students-390.png`.

## Remaining external dependency

Vercel CLI 59.23.0 returned `loggedIn: false`, `reason: login_required`. No project link exists locally. The user was asked to sign in with `npx vercel login`; no secrets should be pasted into chat.

After login: inspect the existing school-erp-v8 project and owner, verify root/branch/build settings, link that existing project, record the final source commit, build and deploy only that project, then repeat live screenshot and route checks. Do not create a similarly named new project. Three production projects are attached to this GitHub repository (school-erp-v8, school-erp-2026, school-erp), so no broad Git push was performed to trigger all three blindly.

Vercel documents repository configuration overrides in [Project settings](https://vercel.com/docs/project-configuration/project-settings) and [Configuring a build](https://vercel.com/docs/builds/configure-a-build).
