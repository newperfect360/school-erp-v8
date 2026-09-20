# Attendance quick calling

Implemented locally in the existing Attendance and shared family-contact components. Not deployed to Vercel.

## Behavior

- Marking Absent immediately displays Father, Mother and Emergency numbers and individual call actions, alongside the existing photo/name/class, WhatsApp, SMS, Audio and history controls.
- Dial links use validated Student Master numbers and recheck immutable student ID, current contact and absent attendance before launch. Stale contacts are blocked for review. Calls do not depend on messaging channel enablement or provider availability.
- Admin/Super Admin can select Father, Mother or Emergency as primary under Attendance → Absence notification settings. The next valid saved number is used if the preferred number is unavailable.
- Call follow-up supports Parent Contacted, No Answer, Busy, Switched Off, Call Back Requested, Medical Reason, Family Reason, Wrong Number and Other, plus a free-text remark.
- History records student ID/name, contact relationship/name/mobile, authenticated user UID/email and initiation timestamp. Outcomes/remarks have their own user/timestamp. A dialer request does not claim connected status or duration.
- Follow-up status appears in the row. Call initiation records Contact Attempted; saved outcomes update the status. Existing historical statuses remain readable.
- Shared history/contact card is used in Student Profile, Emergency Contacts, Trips and Long Absent Students. The existing long-absence intervention status remains separate from daily call follow-up.

## Files

Modified:
- `school-erp-pro/src/pages/Attendance.jsx`: expand contacts immediately for absent students; retain collapsed contacts for other attendance states.
- `school-erp-pro/src/components/FamilyContactCard.jsx`: prioritize saved contacts, bypass messaging configuration for dial links, capture authenticated caller, launch follow-up and history controls.
- `school-erp-pro/src/components/AbsenceCommunication.jsx`: use actual session actor, add Admin primary-contact setting and refresh shared follow-up/history.
- `school-erp-pro/src/services/absenceCommunication.js`: primary ordering, emergency-mobile alias and expanded follow-up/outcome values.
- `school-erp-pro/src/pages/LongAbsence.jsx`: include shared contact/history card and allow calls independently of messaging settings.
- `school-erp-pro/src/App.jsx`: provide authenticated session to shared contact components.

New:
- `school-erp-pro/src/backend/CommunicationSession.js`: authenticated actor context.
- `school-erp-pro/src/components/CallFollowup.jsx`: saved call outcomes, daily status and per-student communication history.
- `school-erp-pro/src/components/FamilyContactCard.css`: touch targets, mobile layout and visible follow-up selectors despite the legacy table select-hiding rule.
- `school-erp-pro/service-tests/absence-quick-contact.test.mjs`: priority fallback, number validation and distinct dial URIs.
- `school-erp-pro/backend/tests/attendance-calls.test.mjs`: authenticated real-app browser workflow using disposable emulator accounts and isolated browser records.

## Verification

- Two service tests passed.
- End-to-end emulator/browser test passed: mark absent; three correct call links; messaging disabled; save medical outcome/remark; verify Attendance and Student Profile history; distinct mappings for two identically named students; mobile 390px layout with call targets at least 44px high.
- Production build passed; lint has no errors (seven pre-existing unrelated warnings).
- No real calls/messages sent. No real student records changed or sample students added to the owner's browser/database. No screenshots/demo pages generated.

## Limits

History still uses the ERP's current browser-local store. It is not yet shared cloud communication history. The earlier production-auth activation/configuration blockers remain. Actual Android/iOS dialer opening and call connection require a handset check; automated tests verified the `tel:` targets while suppressing external device actions. The native Android app does not yet have a production Attendance screen.
