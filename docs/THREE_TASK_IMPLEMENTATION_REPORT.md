# Home, Student Master and Excel import — implementation proof

This pass is limited to the existing React Home, Student Master and Excel/photo import. No new business modules, Android changes, deployment or Firebase integration were performed.

## Workspace inspection

| Question | Finding |
|---|---|
| Frontend | React 19.2.7, Vite 8.1.0, JSX and CSS in `school-erp-pro/`. SheetJS reads/writes Excel. |
| Actual Home | `school-erp-pro/src/pages/PortalHome.jsx`. `src/App.jsx` selects it for Dashboard immediately after local login; `src/main.jsx` mounts the app. |
| Student Master | `src/pages/Students.jsx` owns the records and page state; `StudentDirectory.jsx` renders the table, `components/StudentForm.jsx` handles the form, `StudentProfile.jsx` displays the profile, and `components/StudentActions.jsx` connects lifecycle actions. |
| Students database/API | Browser `localStorage` key `erp_pro_students`, via `src/storage.js`. Import uses `commitStoredBatch`; lifecycle uses `services/lifecycleStore.js`. There is no active server student API or shared cloud database connected to this React app. |
| Backend scaffolding | `src/backend/contracts.js`, `backend/README.md`, `backend/firestore.rules`, `backend/storage.rules`. These are preparation, not deployed authentication/data integration. |
| Theme | `src/index.css`, `src/App.css`, `src/audit-upgrade.css`, `src/design/design-system.css`, `portal.css`, `education-refresh.css`, `institutional.css`; this pass adds `school-portal.css`, loaded last by `src/main.jsx`. Header/navigation are in `PortalShell.jsx`, `SchoolUI.jsx`, `portalNavigation.js`; translations in `language.jsx` and `messages.js`. |
| Other existing projects | Root `index.html`, `app.js`, `style.css`, `modules/`, `patch/` comprise the older vanilla-JavaScript web system. Root `api/` contains communication/health endpoints, not the React Student Master API. Root `npm run dev` serves this older system on 5174. `android-app/GBSSCHOOL/` is the separate Android project. These were not changed. |
| Supporting folders | `assets/` holds the existing school logo; `templates/` legacy templates; `tests/` root legacy checks; React tests/services/artifacts live under `school-erp-pro/`; `docs/`, `notes/`, `releases/` contain documentation and existing release artifacts. |

## What existed before this pass

Connected local workflows already existed for add/edit, archive/restore, class/division/year changes with history, promotion, School Left, Excel templates, `.xlsx/.xls/.csv` parsing, column mapping, validation, duplicate review, Marathi name suggestions and a separate photo-folder importer. The prior Home design was implemented but rejected visually. Emergency Mobile was absent from the directory table. Excel and photos required two separate confirmed imports.

Permanent deletion, real authenticated staff access, cloud student persistence/synchronization and general English-to-Marathi translation were not implemented. Local role selection is only a UI preview.

## Previous work — exact source files

The preceding redesign work touched these existing-project paths (relative to `school-erp-pro/`):

| File | Previous purpose |
|---|---|
| `src/main.jsx` | Load institutional theme. |
| `src/design/institutional.css` | Shared visual system and responsive corrections. |
| `src/design/PortalShell.jsx` | Shared masthead, controls and portal layout. |
| `src/design/SchoolUI.jsx` | Existing school logo as default SchoolMark. |
| `src/design/portalNavigation.js` | Visible student routes, menu ordering and deduplication. |
| `src/pages/PortalHome.jsx` | Prior Home redesign and connected quick actions. |
| `src/pages/PortalContent.jsx` | Accurate empty-gallery messaging. |
| `src/components/StudentForm.jsx` | Grouped student form and bilingual name preview. |
| `src/components/StudentActions.jsx` | Direct row/profile actions and reviewed lifecycle dialog. |
| `src/pages/Students.jsx` | Form/profile/directory integration, stable records and legacy-year handling. |
| `src/pages/StudentDirectory.jsx` | Student Master controls, columns, filters, sorting and pagination. |
| `src/pages/StudentProfile.jsx` | Profile visual layout. |
| `src/pages/StudentImport.jsx` | Marathi preview and import/photo navigation. |
| `src/services/studentLifecycle.js` | Academic-year correction with historical snapshots. |
| `src/services/lifecycleStore.js` | Invalidate lifecycle previews when academic settings change. |
| `tests/institutional-review.spec.js` | Student change flows, responsive review and screenshots. |
| `tests/portal-redesign.spec.js` | Actual Home selector and navigation test time budget. |
| `tests/audit-upgrade.spec.js` | Updated Export Excel button selector. |
| `service-tests/yearCorrection.test.mjs` | Identity/history preservation for year correction. |

Previous documentation: `docs/INSTITUTIONAL_REDESIGN_REVIEW.md`. Previous review gallery: `school-erp-pro/artifacts/institutional-review/`. Existing screenshot suites were refreshed by prior tests. Some earlier source work was already included in repository HEAD when this pass began; a current `git diff` alone is not a complete attribution record. `artifacts/implementation-proof/pre-existing-changes.txt` records the dirty-file list at the start of this pass.

## CHANGED FILES — this pass

Paths below are relative to `school-erp-pro/` unless stated otherwise.

| Exact file | Purpose |
|---|---|
| `src/pages/PortalHome.jsx` | Redesign the actual post-login Home with a full-width school/event feature, institutional introduction, noticeboard and compact connected school sections. Remove the APK promotion card from Home. |
| `src/main.jsx` | Load the new scoped visual treatment last. |
| `src/pages/StudentDirectory.jsx` | Add Emergency Mobile as its own column; explicitly label Student Name. Keep the four top actions and all student row actions connected. |
| `src/pages/Students.jsx` | Clear stale directory filters after adding/importing so saved students can be found immediately. |
| `src/pages/StudentImport.jsx` | Add combined Excel/photo preview and one confirmed local commit; exact matching, invalid/duplicate review, explicit replacement/skip, import history, and mapped-name Marathi suggestions. |
| `src/services/photoImport.js` | Share real image decoding/resizing with both import workflows. |
| `src/pages/PhotoImport.jsx` | Reuse the shared image processor; retain the existing photo-only workflow. |

## NEW FILES — this pass

| Exact file | Purpose |
|---|---|
| `src/design/school-portal.css` | Navy/white school layout, full-width slider, educational sections, compact table actions, import steps and mobile treatment. |
| `tests/implementation-proof.spec.js` | Browser proof: template download, actual XLSX/XLS/CSV imports, photo identity, edit persistence, duplicate/stale guards, mobile screenshots. |
| `scripts/open-implementation-review.mjs` | Open the actual Home, Student Master, Excel Import and evidence gallery in a visible, isolated Edge session without seeding real browser records. |
| `artifacts/implementation-proof/index.html` | Screenshot evidence gallery linked to the real running application; not an alternate app/dashboard. |
| `artifacts/implementation-proof/sample-students.xlsx` | Fictional workbook actually used in the import test. |
| `artifacts/implementation-proof/*.png` | Captures of real application screens from isolated test data. |
| `artifacts/implementation-proof/pre-existing-changes.txt` | Starting workspace change inventory. |
| `docs/THREE_TASK_IMPLEMENTATION_REPORT.md` (workspace root) | This audit, change report and verification record. |

## IMPLEMENTED

- The real Home uses the school logo, institution/school name/address, navy/white header, desktop navigation/dropdowns, announcement strip and school/event slider controls. Mobile uses hamburger/accordion navigation.
- Student Master visibly exposes Add Student, Import Excel, Download Excel Template and Export Excel. It includes all 13 requested columns, including separate father, mother and emergency mobile values; search/filter/sort/pagination and horizontal table scrolling remain available.
- Direct student actions remain View, Edit, Change Class, Change Division, Change Academic Year, Promote, School Left and Archive/Delete. Changes retain the stable student identity and historical records. Delete is soft archive.
- Real Excel import supports `.xlsx`, `.xls`, `.csv`, preview, mapping, validation, separate English/Marathi values, editable Marathi name suggestions, duplicate decisions, error export and explicit confirmation.
- All requested Excel fields are covered by template columns/header aliases, including Student Name/Class/DOB aliases for Student Full Name/Standard/Date of Birth.
- Combined Excel + Photo Folder supports Photo Number, GR, Admission Number and Student ID matching. It matches against the final candidate list to detect ambiguous identifiers, only attaches to selected imported/updated students, decodes/resizes real images, requires explicit replacement or skip, and saves records/photos/history together. Missing photos do not block a reviewed student-only import.
- Browser-local stale-snapshot and rollback protection remain in place. This is not a server transaction or multi-user database.

## NOT IMPLEMENTED / awaiting input

- Exact screenshot-reference matching cannot be verified: the provided attachments and workspace contain no accessible educational reference screenshot. A local path was requested. The redesign follows the written requirements.
- Approved school/event photographs are still needed for a populated school slider. The real gallery/slider is connected, but empty school data displays an explicitly labelled banner. No invented school photos were inserted.
- General English-to-Marathi translation and unrestricted name transliteration: current offline suggestions cover known names; unknown spellings require manual correction.
- Production database/API, Firebase login/permissions and permanent deletion remain outside these three approved tasks. Records persist only in this browser/origin until a backend is integrated.
- User visual approval is pending. No further modules will be developed before approval.

## ERRORS / verification

Verified on 17 September 2026 against `http://127.0.0.1:5186/`:

- 10 relevant browser tests passed across the initial run and targeted reruns: four new implementation-proof tests, two student lifecycle/responsive review tests, existing Excel update validation, Marathi import, photo-only import, and notice/gallery publication tests.
- The initial combined-photo test used an unreadable PNG fixture and correctly stayed blocked before confirmation. Replaced it with two valid, distinct canvas images; the rerun verified each saved image against the preview for its specific GR/student ID. No failed assertion was removed.
- Actual `.xlsx`, `.xls` and `.csv` imports were confirmed and found in Student Master. Edit persisted after reload. Duplicate photos and stale imports were blocked without adding records.
- Add Student, class/division/year changes, safe Delete/archive and preserved attendance/history passed. Desktop/tablet/phone checks covered 1440, 1024, 768, 390 and 360 px with no page overflow.
- Published notices and slider image ordering/navigation passed using isolated fixture content.
- All 18 service tests passed.
- Production build passed. Lint: zero errors, six existing Fast Refresh warnings. Build still reports a large-bundle warning; neither warning is claimed resolved.
- `git diff --check` passed. No browser runtime errors were observed by the implementation-proof workflow.
- The automated visible review browser closed before its third tab finished opening. The app and evidence gallery were then opened successfully in normal Edge. All requested workflows had already been opened and exercised by the browser tests; no claim is made that the interrupted three-tab launcher completed.

Screenshots and the sample workbook use fictional records in an isolated browser context, not the user's normal school data. The visible review browser opens the actual application without inserting test records; the evidence gallery shows the completed import tests.

Run the React app from `school-erp-pro/` with `npm run dev -- --host 127.0.0.1 --port 5186 --strictPort`. The separate root command serves the older system and is not the redesigned entry point.

App: http://127.0.0.1:5186/

Evidence: http://127.0.0.1:5186/artifacts/implementation-proof/index.html
