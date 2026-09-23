# Legacy-to-tenant migration proposal — approval required

No production changes, tenant creation, membership creation, migration or rules deployment have been performed.

## A. Existing structure and links

Read-only recursive enumeration of all collections/subcollections in the existing project `school-managment-8c102`, default database, found:

| Root collection | Count | Existing fields and links |
|---|---:|---|
| students | 2 | name, className, rollNo, parentMobile, createdAt. Document ID is the only existing stable internal identifier. No GR, division or academic year. |
| teachers | 1 | name, mobile, subject, createdAt. No Firebase Auth UID link. |
| attendance | 1 | type=teacher, name, className, date, status, createdAt. No studentId or teacherId; no matching teacher name in the teacher collection. |
| notices | 9 | className, createdBy, date, text, type, createdAt. No verified author UID or stable class reference. |

No other Firestore collections/subcollections were returned, including schools, settings, templates, fees, documents, classes, divisions or academic years. This does not inventory Firebase Storage objects, browser databases or another Firebase database/project. Do not infer that absent cloud collections mean no local school records exist.

Current React operational pages use `storage.js` / `useStoredState` and browser `erp_pro_*` keys. Fees use studentId; results/templates use studentId with legacy GR fallback. Attendance has its own local per-date structure. Old root app.js uses `v32_*`, with studentId and historical name/roll fallback. These are separate record stores, not verified copies of Firestore. Browser-local backups must be supplied and reconciled before removing that dependency. Android currently enters ProductionSignIn; a shared Firebase repository exists but operational screens are not connected. Both repositories already expect schools/{schoolId} and stable IDs.

## B. Proposed single structure

```text
schools/gbs-school
  members/{existingFirebaseUid}
  students/{canonicalExistingStudentDocumentId}
  student_gr/{normalizedGrNumber}
  teachers/{existingTeacherDocumentId}
  attendance/{existingOrStableAttendanceId}       # studentId required
  staff_attendance/{existingAttendanceId}        # teacherId required
  classes/{stableClassId}
  divisions/{stableDivisionId}
  academic_years/{stableAcademicYearId}
  enrollments/{studentIdAndAcademicYearId}
  fees/{stableRecordId}
  notifications/{existingNoticeDocumentId}
  templates/{stableTemplateId}
  documents/{stableDocumentId}
  settings/{settingId}
  results/{stableRecordId}
  certificates/{stableRecordId}
  communication_logs/{stableRecordId}
  audit_logs/{eventId}
  migration_maps/{sourcePathKey}
```

Retain existing repository names academic_years and notifications instead of creating parallel academicYears/notices stores. Additional collections shown here require coordinated shared-schema, Web, Android and security-test changes; they are proposals, not currently supported collections. No empty placeholder records will be created merely to display collection names.

Each student retains one canonical existing Firestore document ID for life; GR remains a separate school field with uniqueness validation. Class/division/roll belong to academic-year enrollment history, not identity. The current enrollment projection needed by existing screens can be stored alongside explicit enrollment references. Do not invent missing GR/division/year values. Ambiguous records remain preserved at source and unresolved in the mapping manifest, not published as valid migrated records.

Reuse the existing membership schema: role, active, passwordSetupComplete, modules, resources, classIds, studentIds. Designated existing Auth UID: F2k0InkD73eV9bDjXRNzl1Bw34j1. No duplicate Auth account or password changes. Owner-approved role SUPER_ADMIN and active=true are intended; setup state must be verified rather than fabricated. Normalize requested ADMIN/HEADMASTER/TEACHER/STAFF consistently across clients and rules while preserving existing role compatibility; do not add a second permission mechanism.

## C. Proposed permanent tenant ID

`gbs-school` — proposed only, not an existing ID or created tenant. Stable across academic years and school display-name changes. This is neither the Firebase project ID nor the Auth UID. Requires approval.

## D. Migration quantities

13 source documents must be preserved. Student sources: 2, canonical target count pending duplicate adjudication (1 if confirmed same child, otherwise 2 with corrected identifiers). Teachers: 1 eligible for mapping review. Staff attendance: 1 blocked on explicit teacher linkage; student attendance: 0. Notices: 9 mapped to notifications after field review. Other cloud collections: 0 observed; browser-local counts unknown. One new membership for the existing administrator Auth UID is proposed, not migrated from an existing profile. Derived class/division/year/enrollment counts depend on verified missing information.

## E. Backup

Fresh backup: `school-erp-pro/backend/production-backup-1790135809094.local`.
SHA-256: `6d47853afe564b2a0f753d173bd0e2ac0ab4a4fe1cc4cd0b15326a939f4fd178`.
Contains all 13 enumerated Firestore documents with raw typed field values and update timestamps, collection inventory, missing-parent entries and current published Firestore rules/release metadata. JSON readback verified and file confirmed Git ignored. Private local file; no school data published in reports.

This is a complete enumerated Firestore document snapshot, not an atomic managed export, Storage object backup, Auth export or browser-local backup. Restore rehearsal is pending. Before writes, re-enumerate, compare source updateTimes, obtain browser/attachment backups, verify an emulator restore, and stop if sources changed. No password/hash/token is included by the backup utility.

## F. Duplicate detection

- Duplicate Firestore document paths: 0.
- Students: 1 duplicate candidate group containing both documents. All business field values match after excluding createdAt; name/class/roll and parent mobile also match.
- GR duplicate check cannot run: both GR values are absent. Both division and academic year values are absent.
- Teachers: 1 source, no intra-collection duplicate pair.
- Attendance: teacher-type record has neither stable teacher nor student linkage; no exact teacher-name match. No automatic name-based assignment is safe.
- These results do not prove the two students are the same person. Owner adjudication is required; never merge/delete by name or mobile. If confirmed duplicate, map both source paths to one canonical existing ID while retaining both untouched legacy documents and provenance.
- Browser-to-cloud duplicates remain unassessed until browser backups are available. Identical notices may be intentional; retain all nine, without content-based merging.

## G. Non-destructive execution and rollback proposal

1. After proposal approval, prepare the reviewed mapping manifest and resolve missing fields, duplicate identity and teacher attendance linkage. Approval alone does not waive unresolved data-integrity checks.
2. Recheck backup completeness/source stability and restore to an isolated emulator. Record target baseline, source updateTimes, target expected versions and hashes. Protect membership provisioning using a separately reviewed/tested rollout; current global authenticated write permission would expose a newly created membership. Do not publish rules as part of this proposal.
3. Copy only approved mappings to the one tenant, preserving IDs, raw provenance and indexes. Use create-only destination preconditions and deterministic mapping keys so reruns cannot create extra entities. Never overwrite an existing target or change legacy records silently. Keep migration mapping records backend-only.
4. Verify source preservation, counts, values, reference integrity, duplicate indexes and permissions before enabling any client writes. Replace operational local-storage reads/writes with shared-repository access on Web/Android. Local cache/queued edits may remain but must never claim authoritative sync before server acknowledgement.
5. Rehearse both sync directions and all five roles, including blocked role escalation/security edits. Real user login must be performed privately; Admin SDK access is not proof of login. Keep old APK/frontend artifacts and configuration for rollback.
6. Before cutover: a failed migration leaves clients on unchanged legacy sources; deactivate the incomplete tenant rollout and retain copied targets for diagnosis. No deletion is necessary.
7. After cutover: pause writes first and export every post-cutover target change. Do not simply revert to legacy and lose new writes. Reconcile the audited delta under a separately approved recovery plan; never overwrite newer records with the snapshot. Restore only verified missing/unmodified records with preconditions.
8. Rules rollback must use a tested restricted compatibility version, not automatically restore the current insecure allow-all-authenticated policy. Obtain separate explicit approval before any rule publication or destructive cleanup. Legacy collections remain intact throughout.

## Approval gate

Approve the proposed `gbs-school` ID and this copy-only migration approach, or request revisions. Migration execution is NOT authorized by writing this proposal. No production data changes will occur until approval and prerequisites are satisfied. Final production security deployment and legacy deletion remain separately gated.
