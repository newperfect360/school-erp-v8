# School portal and Student Master — visual approval checkpoint

Scope: the existing web project only. No new project, Android implementation, Firebase deployment, provider integration or destructive migration.

## Review locally

- App: `http://127.0.0.1:5186/` while the Vite server runs. Existing local review login remains unchanged.
- Screenshot gallery: `http://127.0.0.1:5186/artifacts/institutional-review/index.html`.
- Gallery files: `school-erp-pro/artifacts/institutional-review/`.
- Screenshots use fictional browser-test data, not live school records. The capture process does not seed the user's normal browser profile.

## Visual changes

- Compact school identity header with the existing `assets/school-logo.jpg`, trust/name/address, year selector, language and account controls. A custom logo saved in Settings still takes precedence.
- Navy horizontal navigation on large screens, with compact dropdowns; hamburger/accordion below 1150 px. Student Master and Add Student lead the Students menu. Exam and Results are separate; secondary facilities and scholarship entries remain reachable under More without duplicate destinations.
- Restrained navy/white/gray surfaces, small consistent corner radii, fewer shadows, consistent controls and denser administrative sections.
- Home notice strip, school-photo slider area, noticeboard, visible Add Student quick action, six live summary counts, office links and calendar. Removed the cartoon campus illustration from Home.
- Student profile, import steps, form sections and parent-contact panels follow the same visual treatment.

The accessible attachments did not contain the referenced screenshots or approved school/event photography. This revision follows the written visual direction; exact reference matching is not claimed. Published gallery photos drive the working slider. Until photos are supplied, it shows a plain institutional banner rather than invented school photographs.

## Student workflow changes

- Visible Add Student, Import Excel, Download Excel Template and Export Excel controls.
- Add/Edit form grouped into identity, enrollment, contacts and additional details, including the requested fields and photo input.
- First/middle/last-name entry can assemble Full Name while preserving a manually customised full name.
- Known-name Marathi suggestions appear automatically during English entry and Excel upload; an English/Marathi review block and editable fields preserve both values. Existing custom Marathi spellings are retained.
- Student Master displays photo, English/Marathi names, class/division/roll/GR/year, distinct father/mother numbers, status and visible actions. Search, class/division/year filters, sorting and pagination are available. On small screens all columns remain available through table scrolling.
- View, Edit and Archive/Restore remain direct row actions. Change Class, Change Division, Change Academic Year, Promote, School Left and Delete now open direct student-specific workflows. Roll changes are available inside class/division changes.
- Changes require a reason, before/after preview, acknowledgement and confirmation. A stale preview cannot overwrite changes from another tab. Academic-year setup changes also invalidate a prepared lifecycle transaction.
- Academic-year correction snapshots the previous enrollment and academic evidence, keeps the student ID/class unchanged, and leaves dated attendance and other linked records intact. Promotion remains a separate year-end action.
- Delete is a soft archive. Permanent deletion remains locked, including for the Super Admin role preview, until verified server authorisation exists. No permanent-delete code was added during a visual-only approval stage.
- Existing School Left and bulk promotion/repeat/transfer/passed-out flows are retained. School Left records date/reason/last class/LC details and excludes withdrawn students from active attendance.

## Import and photo handling

Existing `.xlsx`, `.xls`, `.csv` parsing, configurable template, header mapping, duplicate review, validation, error report and explicit Confirm Import remain in place. English and Marathi columns stay separate. The import page now shows the Excel → Marathi review → Photo Folder sequence.

Photo Folder Import is a **second reviewed step after saving the Excel records**, not an atomic combined upload. It matches Photo Number, GR, Admission Number or Student ID, blocks ambiguous identifiers and duplicate/invalid photos, shows missing matches and requires confirmation before saving. No name-based guessing is introduced.

## Deliberate limits

- Offline Marathi spelling suggestions cover known names, including “Shantanu Sunil Pawar → शांतनु सुनील पवार”. Unknown names and general text/address translation require manual input; a general translation service was not added under this visual-design scope.
- Local role previews are not production access control. Parent contacts remain in the internal review workspace; the public APK page exposes no Student Master data.
- No actual school photographs or reference screenshots are invented. Upload approved photos in School Gallery to review the populated slider.
- Production backend work waits for visual approval, as requested.

## Verification

The review suite exercises manual add/name suggestions, sorting/pagination, class/division/year changes, preserved enrollment snapshots, safe archive, stale-preview rejection, Excel/Marathi preview, navigation and screenshots at 1440, 1024, 768, 390 and 360 px. Existing tests cover exact photo/parent mapping, archive restoration, promotion, School Left and historical attendance.

Visual testing found and fixed inherited white button text, a tablet dropdown transform, an old mobile rule hiding the new Name column, and duplicate navigation entries. See final test results reported with this review. Existing Fast Refresh lint advisories and the large application bundle remain outside this design scope.

Final verification (17 September 2026):

- Production build passed. Lint completed with zero errors and six existing Fast Refresh warnings; the build retains its large-bundle advisory.
- All 18 service tests passed, including stable student identity and historical evidence after academic-year correction.
- The 41-test browser run recorded two failures: an outdated export-button label in a test and the exhaustive navigation test exceeding its time budget. The selector now matches Export Excel; the navigation budget was increased without removing assertions.
- All four targeted final browser checks passed: Excel import/export, the complete student workflow and refreshed screenshots, stale-preview rejection, and every dropdown destination with responsive checks. The comprehensive navigation check completed in 3.2 minutes.
- Screenshot review covered the actual school logo and header controls on desktop/mobile, the grouped Add Student form, and the requested workflow gallery. Tests used isolated fictional records.
- `git diff --check` passed.

Stop here for visual review; do not begin major backend work or deployment.
