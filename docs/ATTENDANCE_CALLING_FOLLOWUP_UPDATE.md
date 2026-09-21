# Attendance calling follow-up — 21 September 2026

Existing Attendance displays Father/Mother/Emergency contact cards immediately for draft Absent marks. The same card is used in Student Profile, Emergency Contacts, Long Absence and relevant trip views. It provides native telephone links, messaging composers, audio navigation, communication history and follow-up status.

Changes in this update:

- `school-erp-pro/src/components/FamilyContactCard.jsx`: student-specific primary notification contact takes priority over the school default; existing valid-number fallback remains.
- `school-erp-pro/src/components/AbsenceCommunication.jsx`: applies the same priority and prevents messaging channel configuration from disabling the generic Call Parent action.
- `school-erp-pro/src/components/CallFollowup.jsx`: saved calls for the selected attendance date can be reopened from history to record/update an outcome and remark, including after reopening the page.
- `school-erp-pro/backend/tests/attendance-calls.test.mjs`: extends the browser regression to cover saved-call follow-up and the generic Call Parent link while messaging channels are disabled.

Verification performed this update: both contact-number/dial-URI service tests passed; production build passed; lint has no errors and seven existing warnings. The extended browser test was not run: the previous elevated emulator execution was rejected by automatic approval review because workspace credits were exhausted. Existing browser tests passed in the preceding implementation, but that is not a fresh verification of these changes.

No real calls or messages were sent. Device call connection/duration cannot be inferred from clicking a telephone link. Communication history still persists in browser storage; production cloud synchronization and Android handset verification remain pending. This update was not deployed to Vercel.
