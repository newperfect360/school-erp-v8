# Attendance and parent/staff communication — implementation status

Date: 20 September 2026.

## Current status

Implemented in the existing React application under `school-erp-pro`. This is a **browser-local dry-run implementation, not a completed production Web/Android communication system**. No school records were removed and no real SMS/WhatsApp notifications were sent. School identity, logo, templates and existing modules were retained.

All school classes remain disabled by default. The school's actual trial academic year/class/division has not been supplied. Tests enabled one disposable class in an isolated browser context only. Another test class verified exclusion from the notification queue.

## Actual pages and actions

- Settings → School Timing / Attendance Automation / Message Templates opens the existing Automation page.
- Automation: editable weekday/Saturday times, attendance and late cutoffs, weekly holidays, dated holidays/reopening dates, special/exam overrides, enabled classes, custom statuses, absence/percentage thresholds, summary time and retry limits.
- Attendance: academic year/class/division/date selection; P/A/L/AL/PL quick marks, all additional statuses in the visible dropdown, Mark All Present, separate arrival/out time, reason and teacher remark. Draft changes do not prepare automation jobs. Review verifies the whole selected class. Final Submit atomically saves marks, submission metadata and dry-run jobs. Repeating a submission does not duplicate jobs. Finalized registers are read-only; a correction workflow is not implemented.
- Immediate father/mother/emergency dialer actions remain available for draft Absent marks. Calls use Student Master IDs and numbers and do not depend on SMS/WhatsApp providers. These device actions are separate from automated notification previews.
- Student Checkout: separate Permission / Early Leave Register with request category, date, out/expected-return time, reason, written application, permission authority, parent-contact confirmation and remark. Review/Confirm saves the register and configured previews. This does not claim observed checkout or silently change finalized class attendance.
- Staff: Staff Attendance appears above the existing Staff Master. It uses existing Teacher/Staff Master IDs, all seven statuses, in/out/late time, leave type, reason and remark, followed by Review/Final Submit. Opted-in management recipients receive dry-run absence/late/summary jobs.
- Home: finalized student/staff counts, communication counts and absence/low-attendance flags, gated by module permissions.
- Automation: all 34 requested parent templates and three staff templates, editable English/Marathi, enable/disable, duplicate, bilingual preview and Test Send (dry-run log only). Per-student primary/secondary contact, channel and language preferences are saved on existing student records. Missing primary contacts fall back to available valid contacts.
- Queue: recipient, mobile, event/template, date/time, channel, actor, message and validation state. Deduplication freezes prepared event recipients. Queued previews are never marked Sent or Delivered. Missing contacts/fields produce Failed validations; manual validation retry is bounded. Dry-run jobs cannot open the existing device fallback dispatch path.
- Due preview preparation: school closure, Saturday closure, explicit holiday, special closure, birthday, fee due, consecutive absence, low attendance and finalized staff daily summary. It runs while the signed-in web app is open, plus an explicit Prepare button. Fee receipt saves feed the new template engine. Other templates are available for manually reviewed preview/test events; comprehensive automatic hooks from every other module are not implemented.

## Calculation and safety details

- Sundays/configured holidays are excluded; special working-day overrides are supported. Holiday dates never generate normal school-closing messages.
- A missing mark is not treated as Present or Absent. Attendance percentage uses marked working days; unmarked days and total working days are shown separately. Official Duty counts as present for percentage calculations.
- School-closing messages never assert that a child boarded transport or reached home.
- Stable student IDs, academic-year/class/division scope, source snapshots and atomic local commits protect against name-based matching and stale review submissions. Browser storage is not a substitute for server authorization or shared synchronization.
- Dry Run is enforced by the engine even if a stored setting attempts to disable it. Live activation is intentionally unavailable until server/provider setup and explicit Admin approval.

## Verification

- Production build: passed. Existing bundle-size warning remains.
- Lint: zero errors; seven pre-existing warnings.
- Eight pure service tests: passed (including the two existing contact tests). Coverage includes all 37 bilingual templates, calendar overrides, class isolation, correct parent numbers, same-number deduplication, bounded failed-validation retry and holiday-aware attendance calculations.
- Nine emulator/browser/backend tests: passed serially against `demo-gbs-school`. These include the new actual-page attendance workflow, existing one-tap calling/history, login/password/logout/role controls, offline queue, Firestore permissions and version conflicts.
- Expanded attendance browser trial passed afterward: P/A/L, Approved Leave, Sick Leave, Permission/Early Leave, written application, normal/Saturday closure, Sunday/configured holiday, special closure, fee received/due, consecutive absence, low attendance; staff Present/Absent/Late/On Leave and management summary.
- Desktop and 390px mobile browser view were exercised. No new screenshots or demo pages were created. Real handset calling, provider delivery and Android/Web attendance synchronization were not verified.
- All test accounts and student/staff records were disposable emulator/browser fixtures, separate from the owner's browser and live school database.

Generated English and Marathi examples for every template are in `ATTENDANCE_AUTOMATION_MESSAGE_PREVIEWS.md`. They are explicitly labeled test-fixture previews, not a claim that the school's real trial ran.

## Not implemented / required before production

1. An approved school tenant/project and activated staff memberships. Configuration identifiers and the selected trial class are still required.
2. Migration/integration of these attendance, permission, staff and queue records into the shared backend. These actual pages currently persist to browser storage. Existing Firebase repository/auth infrastructure is not yet wired to these new workflows.
3. Android attendance/permission/staff/queue UI and verified cross-device live synchronization. No Android changes or rebuilt APK are included in this attendance task.
4. Server-side finalization authorization, transactionally created outbox jobs, school-timezone background scheduler, approved SMS/WhatsApp providers, authenticated delivery webhooks and real bounded delivery retries. No credentials should be placed in the frontend.
5. Explicit Admin approval to enable real bulk delivery after the selected class trial succeeds. Sent/Delivered must only come from trusted provider results.
6. Reviewed finalized-attendance corrections and server validation of Admin-defined custom statuses.
7. Full automatic event hooks for every non-attendance module/template. Manual previews are available; template existence does not imply a live automatic trigger.

## Files introduced in this task

| File | Purpose |
| --- | --- |
| `school-erp-pro/src/services/attendanceAutomation.js` | Calendar, templates, scopes, recipient resolution, dry-run jobs, retry validation and statistics |
| `school-erp-pro/src/services/attendanceAutomationStore.js` | Draft review/finalization and due-preview preparation |
| `school-erp-pro/src/components/AttendanceFinalization.jsx` | Whole-class review/final-submit controls |
| `school-erp-pro/src/components/AttendanceMarkDetails.jsx` | Arrival/out time, reason and separate teacher remark |
| `school-erp-pro/src/components/AutomationControls.jsx` | Real timing, trial, template, management, preference and queue controls |
| `school-erp-pro/src/components/AutomationControls.css` | Responsive controls and visible attendance status selection |
| `school-erp-pro/src/components/AttendanceToday.jsx` | Finalized dashboard counts and follow-up flags |
| `school-erp-pro/src/components/StaffAttendance.jsx` | Staff draft/review/final attendance register |
| `school-erp-pro/src/components/PermissionRegister.jsx` | Permission/early leave register and dry-run events |
| `school-erp-pro/service-tests/attendance-automation.test.mjs` | Pure engine tests |
| `school-erp-pro/backend/tests/attendance-automation.test.mjs` | Actual-app emulator/browser trial |
| `docs/ATTENDANCE_AUTOMATION_STATUS.md` | This implementation and verification report |
| `docs/ATTENDANCE_AUTOMATION_MESSAGE_PREVIEWS.md` | Generated bilingual fixture previews |

## Existing files changed in this task

| File | Purpose |
| --- | --- |
| `school-erp-pro/src/pages/Attendance.jsx` | Scoped draft attendance and finalization integration |
| `school-erp-pro/src/pages/AutomationSettings.jsx` | Replaced old automation controls with the actual new controls; retained previous configuration for review |
| `school-erp-pro/src/pages/SchoolOperations.jsx` | Added Staff Attendance to existing Staff page |
| `school-erp-pro/src/pages/StudentCheckout.jsx` | Added permission register without removing observed checkout |
| `school-erp-pro/src/pages/Settings.jsx` | Linked school timing and communication settings |
| `school-erp-pro/src/pages/PortalHome.jsx` | Added finalized attendance summary |
| `school-erp-pro/src/pages/Fees.jsx` | Supplies fee type/date/receipt to dry-run receipt events |
| `school-erp-pro/src/App.jsx` | Settings navigation and new due-preview scheduler integration |
| `school-erp-pro/src/services/messageStore.js` | Routes supported events through trial engine; blocks dry-run dispatch |
| `school-erp-pro/src/components/FamilyContactCard.jsx` | Resolves draft Absent state for immediate calls |
| `school-erp-pro/src/components/AbsenceCommunication.jsx` | Resolves draft Absent state and removes obsolete tick-trigger setting |
| `shared/school-data-schema.json` | Adds built-in attendance statuses to the existing shared record contract |

Earlier authentication, cleanup-backup and quick-calling changes remain in the workspace and are documented separately. No production deployment was performed as part of this task.
