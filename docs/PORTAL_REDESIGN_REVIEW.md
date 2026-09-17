# Educational portal — first visual review

The existing React project now has an institution-style portal shell. The legacy root application, school records and separate `android-app` project were retained. No backend deployment or destructive migration was performed.

## Review locally

- Working application: http://127.0.0.1:5185/
- Screen gallery: http://127.0.0.1:5185/artifacts/portal-redesign/index.html
- Local review credentials: `admin` / `123456` (unchanged; not production authentication).
- Restart from `school-erp-pro`: `npm run dev -- --host 127.0.0.1 --port 5185 --strictPort`.

## What changed

- Configurable school masthead with logo, trust/institution, full school name, address, school code, UDISE, academic year, language switch, notices and profile/logout actions. School code/UDISE/year fields added to existing Settings.
- Home plus 13 navigation groups with every requested submenu. Desktop dropdowns become scrollable accordion groups on mobile. Existing routes remain mapped to their working modules. Related submenu actions can share a module; this review does not imply a separate backend feature for each label.
- Blue/white design system across forms, tables, cards, buttons, page headings, academic pages and login. Original school illustration uses the existing code-native artwork; no external photograph or fictional school event is presented as authentic.
- Homepage event/photo slider, record-based dashboard counts, all 15 requested quick actions, upcoming school calendar and prominent Excel import entry.
- Administrator notice drafts, explicit publish/unpublish and rotating ticker. Administrator image upload/hide/remove/reorder, previous/next controls and pause. These new records save under separate `erp_pro_portal_notices` / `erp_pro_portal_slides` browser-local keys. Existing notices remain accessible through More → Office Notice Register.
- Student Master exposes template download, upload, export and the complete preview/mapping/validation/duplicate/error-report workflow. Add-student, archived-student and class submenu entry points now select their intended views. Attendance submenu choices apply a visible, editable status filter.
- Academic centre for classes 8–12, subjects, timetable, homework, assignments, marks and progress/result formats. Unconfigured institutional sections and staff attendance show **Setup Required**, without invented records.
- Nine role previews filter navigation, dashboard actions and content-management controls. A central UI guard also rejects navigation to pages outside the preview role.
- English/Marathi navigation and portal copy use the existing language architecture. Student name translation remains editable through the existing import/editor; automatic transliteration has not been connected.

## Explicit boundaries

- **Role preview is UI-only**, not authorization. Real teacher identity, class/subject access enforcement, OTP and server permissions remain unconfigured. The visible selector is deliberately labelled as a design-review tool.
- Notice/slider records and uploaded images are local to this browser. No cloud publication, automated parent dispatch or production access changes occur.
- Official school information, affiliation, approved photography and certificate formats remain the school's inputs. Physical Android behavior and provider APIs are outside this UI stage.
- The brief's reference images were not present in the supplied attachment folder; this design follows the written brief and is original.

## Validation

- **22 browser tests passed** in the final combined run; **7 import/results service tests passed**. All **127 submenu destinations across 13 groups** were exercised, plus desktop/tablet/mobile layout checks at 1440, 1024, 768, 390 and 360 pixels.
- Notice draft/publish/unpublish, slider upload/order/next, identity settings and role preview controls exercised with isolated fictional fixtures.
- Existing student/marks import, parent contact mapping/history, documents, QR lookup, archive/restore, backup, lending and office-register regression tests adapted to the new navigation.
- Production build and lint checked. Existing bundle-size and Fast Refresh export warnings remain nonblocking.
- Review screenshots are in `school-erp-pro/artifacts/portal-redesign/`. These do not seed or overwrite the user's school data.

This is the requested first visual review stage. Major backend/database work and deployment remain paused pending design approval.
