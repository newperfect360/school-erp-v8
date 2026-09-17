# Student lifecycle review

Implemented in the existing React school portal. Student IDs and GR numbers remain unchanged; no existing data was deleted and the separate Android project was not modified. No deployment or real parent contact was performed.

## Open the workflow

Run/open <http://127.0.0.1:5185/>. Local review login: `admin` / `123456` (not production authentication).

1. Students → **Promote Students / Year-End** or **Student Lifecycle / History**.
2. Filter source academic year and class; select one student, selected students or the visible enrolled class.
3. Review available year-tagged marks in each row. Choose a common action and optional individual Promote / Repeat / Detained / Result Pending / School Left decisions.
4. Enter the next academic year, reason, optional destination division and roll overrides. Missing original years can be initialized with **Set Initial Academic Year**. Existing years require consecutive year-end processing.
5. Preview old/new values, acknowledge the review and confirm. The same Student Master records are updated. Previous-year attendance and marks are copied into history snapshots; original source records remain intact.
6. Use status filters for promoted, repeated, passed-out, school-left, transferred, archived and other records. Open the linked student profile or export the current report.
7. Attendance → **Long Absent Students** for absence counts, editable English/Marathi messages, exact-parent device links, audio preparation and follow-up.

[Screenshot gallery](../school-erp-pro/artifacts/lifecycle-review/index.html)

## Behavior and boundaries

| Requirement | Implementation |
|---|---|
| Delete / archive / restore | Delete Student performs soft archive. Restore retains the previous status; restoring a withdrawn student does not automatically re-enroll them. Attendance, results, fees, certificates and communications are not removed. |
| Permanent deletion | Locked. Super Admin role preview can see a warning and selected linked-record counts. A browser role selector cannot authorize irreversible deletion. A verified server permission, comprehensive dependency review, confirmation and immutable audit are still required. No hard-delete function is exposed. |
| Status options | Active, Promoted, Repeated, Passed Out, School Left, Transferred, TC/LC Issued, Long Absent, Suspended, Archived and Inactive. Dedicated actions enforce exit/archive data. |
| Promotion / year-end | Individual, selected and class selection. Numeric standards advance by one; standard 12 uses Passed Out / School Completed. Next year must follow the current year. Destination roll conflicts are rejected. Re-running the same year transition fails. |
| Repeat / detained / pending | Remains in the same standard for the next year. Promotion decision is stored separately; enrollment status is Repeated. |
| Class transfer | Standard, division and roll may change with a reason, before/after log and history snapshot. Student Master editing directs enrollment changes to Lifecycle. Reviewed Excel changes also record movements and historical snapshots. |
| School left / transferred | Leaving date, reason, last class, latest saved attendance date, destination, LC number/date and remarks saved. Future/invalid exit dates rejected. Removed from active attendance and dashboard counts; source records retained. |
| LC issue | Archived/departed students remain selectable in the document studio. An explicit actual-issue checkbox records TC/LC Issued, certificate number/date, movement and academic snapshot. Generating a draft alone does not withdraw the student. School-approved official templates remain a separate requirement. |
| Academic / movement history | Year/class/division/roll/status, year-tagged marks, dated attendance snapshot, promotion decision, old/new values, reason, local-review actor and timestamp. Historical snapshot attendance uses June–May or the stored enrollment start. Untagged legacy marks are not guessed into a year and remain in original Results. |
| Absence calculation | Saved Absent records only. Counts: today, consecutive recorded school days, month and year, plus last present date. Dates with no register are skipped. An unmarked student on a recorded date breaks the streak; Leave/Present/other statuses also break it. This is not a verified holiday-calendar calculation. |
| Alerts | Default off; 1/3/5/7/custom days, parent/staff destinations and local deduplicated Prepared alerts. Enabled rules prepare on the app's existing signed-in interval or manually. Requires explicit Absent on the requested date; old streaks do not imply absence today. Five-day alerts target Teacher; seven-day alerts target Headmaster/Admin. No background server delivery is active. |
| Audio | Editable English/Marathi text, browser speech preview, recorded/uploaded template and handoff to the existing audio-sharing/history screen. Browser TTS does not create an audio attachment. Server-generated downloadable speech and physical-device voice/share verification remain pending. |
| Parent communication | Relationship selection with masked display, exact Student Master phone links, individual calls, and saved initiation history. Current contact/enrollment/attendance/channel settings are rechecked at click time. Actual carrier connection, answering or delivery is not inferred. |
| Follow-up | Not Contacted, Parent Contacted, No Answer, Medical Reason, Family Reason, Out of Station, At Risk of Dropout, Returned to School, Follow-up Required. Status saved with actor/time. |
| Reports | Status-filtered Excel/CSV; academic and movement history Excel/CSV; long-absence Excel/CSV. PDF uses browser Print / Save as PDF. |
| Storage / security | Browser-local reviewed commits with stale-preview protection and rollback; not a cross-tab/cloud database transaction. JSON backup includes new lifecycle collections; binary audio still needs separate backup. Backend collection contracts extended. Staff roles remain UI previews until Firebase/server authorization is configured. |

## Test evidence

- Lifecycle browser suite: **3 passed in one final run**, covering mixed bulk promotion/repeat, unchanged IDs/GR/history, stale-preview rejection, school exit excluding attendance, soft delete/restore, actual LC issue, absence contacts, Marathi text, deduplicated alert preparation, follow-up persistence and 390px layouts.
- Combined related browser run: **26 passed initially**. Three failures were outdated test expectations/selectors: changed call status, changed archive filter label, and the new test's missing English-language fixture. All three targeted reruns passed. No failed scenario remains from the 29 selected browser scenarios.
- Service tests: **15 passed**, including promotion/repeat invariants, invalid year/exit transitions, archive/restore semantics and absence gaps.
- Existing student-creation, import, certificate, audio, backup, attendance mapping, fee/library/result and trip tests passed in the related run/reruns.
- Browser speech quality, native dialer/SMS/WhatsApp execution, real microphone/device sharing, provider alerts and authenticated Super Admin deletion are not verified by these browser tests. Tests intercepted contact navigation; no real parents were contacted.

The portal is ready for local workflow review. Production security, server automation, hard deletion and server text-to-speech remain unconnected dependencies, not completed features.
