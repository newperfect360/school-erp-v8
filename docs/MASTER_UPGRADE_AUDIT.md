# School ERP master upgrade — audit and core design review

Date: 17 September 2026. Scope: existing repository; no new project, production migration,
deployment, Android build, external messages, or school-data deletion performed.

## Approval boundary

The supplied master instruction explicitly requires: **“Redesign the core … first.
Run the project and show me these redesigned screens. Once I approve the visual design,
apply the same design system to the remaining modules.”** This delivery stops at that
core review. It does not claim all twelve phases are implemented or production-ready.

## Existing architecture reviewed

| Area | Finding | Status / next action |
| --- | --- | --- |
| Entry points | Root `index.html` / `app.js` is a legacy application. `school-erp-pro` is a separate existing React/Vite frontend in the same repository. Root deployment rewrites target the legacy HTML. | Preserve both. Confirm intended deployment entry after review. |
| Data | React modules store arrays/objects under `erp_pro_*` and `schoolSettings` in localStorage. There is no transactional relational model or tenant ownership. Fields include both English keys and Marathi display-label keys. | No migration. Introduce versioned repositories after approval. |
| Legacy Firebase | Root `firebase-config.js` initializes an existing Firebase project. React does not use Firebase Auth/Firestore/Storage. No deployed-rule evidence is available in the repository. | No cloud reads/writes or rule deployment attempted. Review live rules only with approved access. Public Firebase client identifiers are not server credentials. |
| Authentication | `App.jsx` originally accepted one hard-coded administrator credential and stored logged-in state only in React memory. Reload signs out. | Existing local review access retained; not secure authentication. No passwords newly stored. |
| Users and roles | `Users.jsx` is an unrouted prototype. There is no enforced teacher identity, permission service, school boundary, or assigned-class server authorization. | Pending phase 3. Teacher workspace is explicitly an administrator preview, not a staff account. |
| OTP and recovery | No challenge lifecycle, OTP sender, expiry, attempt limit, recovery flow, disable-user or revocation service. | Requires identity/provider setup. Login help does not pretend to send OTP/reset emails. |
| UI | Generic mixed green panels, inconsistent density, prominent setup forms, long single-level navigation, and duplicated forms. | Core redesign completed. Remaining module layouts await approval. |
| Routing | Local component switching; no public student routes. Generic SchoolOperations reused hook state across modules and conditionally called hooks for Backup. | Fixed hook composition and keyed module instances; no public student URLs introduced. |
| Library | A dedicated Library component and generic legacy Library register use different storage keys; existing navigation used the generic register. | Legacy route deliberately retained so old catalog data remains accessible. Consolidation needs explicit adapter/mapping in phase 7. |
| Student Master | Unique IDs on create/import, local photos, basic validation, search and class/division filters. Delete is permanent after confirmation. No shared version/soft-delete scheme. | Existing data and filters preserved. Directory/profile redesigned. Repository-wide archive/restore remains pending; no actual records deleted. |
| Excel | XLSX/CSV parsing, mapping, row validation, duplicate handling, export and local import log exist. No proper reviewed transliteration pipeline. Batch duplicate detection needs strengthening. | Existing import preserved behind a dedicated action; bilingual conversion deferred to phase 4/5. |
| Bilingual text | Existing labels mostly Marathi, some English. No application translation catalog or independent English/Marathi fields enforced. | Added language context, persisted EN/मराठी preference, core labels and non-mutating name adapters. No automatic name conversion. |
| Attendance | Date/student-ID keyed records; unmarked rows visually defaulted Present. Dashboard treated other statuses as pending. Bulk saving could replace a whole day's register. | Core shows unmarked counts accurately; class/division/search filters; visible-row saves merge other classes' entries. Existing absence actions/history retained. |
| Results | Selection matches student by name; duplicate names can map incorrectly. Maximum-marks validation does not reject zero. | High-priority phase 6 fixes; not silently rewritten during visual review. |
| Certificates | Name-based autofill, inline format and raw-text QR. Print uses browser print, not a template/PDF service. | Pending ID-based mapping, template engine, versioned issuance and print validation. |
| QR | Local QR generation exists, but old cards/certificates encode raw text and claim verification without a protected verifier. | New core profile QR encodes only opaque student ID; lookup is internal after current login, not a public URL. Camera scanning and authenticated server resolution remain pending. |
| Homework / classwork | Local CRUD; homework requires date; attachments store filenames rather than managed assets. | Existing screens preserved. Personalized data adapters and file service need phase 6. |
| Trips | Local trip/participant/consent workflow exists. | Needs detailed permission, safety and data-lifecycle checks after design approval. |
| Sports | Local athlete/equipment records, no robust Student Master foreign keys or transactional inventory. | Pending phase 7. |
| Scholarship / fees / transport / meetings | Mostly generic local forms. No domain constraints/workers or production finance controls. | Pending module-specific implementation. |
| Communications | Absence links, browser history, contact selection, manual audio upload/share, bulk recipient queues and voice job contract exist. | Kept operational and retested. No delivery claims from composer/dialer opening. |
| Notification center / automation | Current generic records do not execute rules or integrate provider delivery receipts. | Pending phase 8/9; no uncontrolled sender enabled. |
| APIs | Six serverless endpoints; proxies validate some inputs/destination origins and time out requests. No authenticated school membership, rate limiter or server-bound identity. CORS permits all origins; credentials accepted in request/query. | Production blocker. Keep existing behavior isolated from redesigned core; replace with authenticated provider adapter in approved backend phase. |
| Secrets | Settings can save WhatsApp tokens in browser storage; legacy proxies pass provider credentials in URLs. | Production blocker. Move provider secrets server-side after approval; do not seed real credentials into review. |
| Backup / audit | Download/restore of localStorage exists. Restore does not stage/validate a transaction or create a pre-restore snapshot. Audit actor is hard-coded admin. | No restore executed. Automated database/file backup, restore tests, immutable actor-aware audit and retention remain pending. |
| Uploads | Some photo inputs check MIME and size but accept arbitrary image MIME; no server signature scanning/storage rules. | Pending upload service with byte/type limits and image decoding. |
| Empty/error states | Shared PageBoundary and toasts exist. Some generic modules are only empty forms. | Core gets useful action-based empties, inline login errors, no fabricated counts, search no-results. Async loading/permission states need actual backend. |
| Mobile | Earlier desktop-first tables required horizontal scroll. | Core mobile register cards, directory compact columns, profile stacking, bottom navigation and focus-contained drawer implemented. |
| Android | No native project/package/signing pipeline. | Documentation preparation only; final Android implementation deferred. |

## Completed in this review

- Central academic design tokens, type hierarchy, buttons, inputs, panels, badges, icons,
  responsive rules and print exclusions in `src/design`.
- New school sign-in presentation, navigation groups, language switch, academic-year
  header, module/student search and mobile bottom navigation.
- Data-driven school dashboard with accurate recorded/pending attendance, class bars,
  real calendar entries, homework, noticeboard and working navigation shortcuts.
- Teacher workspace showing only the selected teacher's mapped classes in the preview;
  ambiguous duplicate teacher names are not used for legacy assignment matching.
- Student directory, filtered search, internal profile with bilingual display, attendance,
  result/certificate records keyed by ID or GR, and an opaque-ID QR/reference lookup.
- Attendance workspace with class/division filters, mobile controls, visible-row merge
  saves and existing WhatsApp/SMS/call/audio/history workflows.

## Fixed during review

- Conditional hooks in SchoolOperations and stale state between generic module routes.
- Incorrect dashboard pending counts for leave/late/other recorded statuses.
- Risk of a filtered attendance save replacing another class's saved entries.
- Class filter/target student navigation remounts the intended screen with the selected ID.
- Existing Student Master search/filter changes were retained.

## Pending after visual approval

| Phase | Deliverable | Dependency |
| --- | --- | --- |
| 3 | Unique teacher/staff identity; server-enforced configurable roles; class/subject scopes; OTP/reset, expiry, rate limits, disable/revoke, audit actor | Approved identity architecture; Firebase project/environment access; OTP/email credentials |
| 4 | `*_en` / `*_mr` schema; stable translation catalog; reviewed proper-name transliteration; Hindi-ready locale registration | Approved transliteration/translation provider or reviewed local strategy; no original-value overwrite |
| 5 | Reviewed bilingual Excel preview; batch duplicate validation; asset storage; QR camera workflow; central ID-based autofill | Schema and access boundaries |
| 6–7 | Apply approved design to homework, exams/results, templates/certificates, trips/sports/library/scholarships | Core design approval and domain validations |
| 8–9 | Audio recording/storage, internal groups, notification center, official messaging adapters and explicit automation switches | Provider credentials, approved sender IDs/templates and delivery callbacks |
| 10 | Archive/restore/version history, staged backups, cloud rules/storage/worker preparation | Separate migration plan, verified export/restore, explicit migration approval |
| 11 | Versioned shared API contracts; Android manifests/config and release checklist | Stable web/auth/API behavior; package identity and production URLs |
| 12 | Full role matrix, provider mocks, real-device/mobile acceptance, import/PDF/QR and restoration audit | Implemented features and approved staging credentials |

## Requires your approval

1. Visual design of the core screens shown in the review gallery.
2. Later, a concrete migration plan with backup, mapping, staging tests, rollback and
   the exact Firebase project/data scope. Visual approval is **not** migration approval.
3. Approved official school document formats before final template/PDF acceptance.

## Requires external services or actual credentials

Firebase Auth/Firestore/Storage and staging rules; OTP SMS/email service; official
WhatsApp/SMS sender configuration; optional telephony; push notification credentials;
translation/transliteration provider if chosen. None are invented or shipped in the client.

## Future security direction (not deployed)

Authorize both API access and every student/file query using school membership and
assigned scope. Client menu hiding is not authorization. Web session endpoints need
CSRF protection and secure session handling; mobile clients use verified identity tokens.
Server/Admin SDK access needs explicit authorization because it bypasses Firestore rules.
See [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies),
[role-based rules](https://firebase.google.com/docs/firestore/solutions/role-based-access),
and [query authorization](https://firebase.google.com/docs/firestore/security/rules-query).

## Evidence and limitations

Screenshots use fictional fixtures only in isolated Playwright browser contexts. They
do not seed or overwrite the user's browser data. Local runtime: port 5180. Review
gallery: `/artifacts/core-design-review/index.html`. Test results are recorded in
`CORE_DESIGN_REVIEW.md` after verification. No real SMS, WhatsApp, call, OTP, production
Firebase request, camera capture, payment, deployment or Android publication is part
of these tests. A repository/runtime audit is not a claim of a production penetration test.
