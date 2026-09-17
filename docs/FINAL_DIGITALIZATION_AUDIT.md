# Final school digitalization audit

Scope: the existing React portal, preserved legacy application/API, and separate Android project. No production deployment, destructive migration or real-data import is authorized. This review precedes further implementation.

## Baseline findings before this development pass

| Area | Status | Evidence / action |
|---|---|---|
| Portal navigation, responsive dashboard | COMPLETED / NEEDS APPROVAL | 127 submenu entries exercised in previous review. Design remains unapproved. |
| Student Master, Excel import/update/export | COMPLETED (local) | Preview, mapping, identity validation, safe updates and stable IDs exist. Photo Number and bilingual family/address fields need extension. |
| Excel + photo folder | MISSING | No identifier-based image matching or replace/skip preview. Implement without name-based guesses. |
| Attendance / absence communication | COMPLETED (local) / INCOMPLETE | Absent composer/dialer/history works; present notification, checkout and closing drafts missing. |
| Communication priority / fallback | INCOMPLETE / NEEDS API / NEEDS CREDENTIALS | Device links exist. Add explicit channel switches, priorities and reviewed fallback. No approved server provider configured. |
| Audio | INCOMPLETE | File upload/share exists; microphone recording and saved audio templates missing. |
| School closing / checkout | MISSING | Add configurable local draft preparation and actual checkout records. Never infer physical departure from presence. Background execution needs server scheduler. |
| Teacher identity, OTP, recovery | NEEDS API / NEEDS CREDENTIALS | Login is a fixed local review gate. Role preview is not security. No approved Firebase staging identity project or verified server permissions. |
| Staff account preparation | INCOMPLETE | Role/class/subject requests exist; employee/mobile/username/photo and Accounts Staff need addition. No plaintext password storage. |
| English/Marathi data | INCOMPLETE | Student names stored separately; bilingual parent/address fields and correction workflow need extension. General automated transliteration is not connected. |
| Certificates / ID / QR | COMPLETED (local) / NEEDS FORMAT | 22 draft formats, history and QR lookup work; official formats await school. Review ID fields after photo mapping. |
| Library | COMPLETED (local) / INCOMPLETE | Inventory/issue/return/due works. Parent notifications and overdue drafts missing. |
| Fees | INCOMPLETE | Generic free-text register lacks stable student linkage and messageable receipt ledger. Preserve old rows separately. |
| Results | COMPLETED (local) / INCOMPLETE | Marks validation and printable results work; publication event and parent notification missing. |
| Parent meetings / visits | INCOMPLETE / MISSING | Generic meeting rows do not cover full student-linked interaction lifecycle. |
| Trips / sports / scholarships | COMPLETED (local registers) / INCOMPLETE | Participant selection and communication entry points exist; structured event templates and scoped reminder drafts need work. |
| Notice publishing | COMPLETED (local) / NEEDS API | Portal drafts/publish/unpublish works; no actual push or automatic parent delivery. |
| Automation | INCOMPLETE | Previous menu is a planning register without worker or structured controls. Add default-off controls and idempotent draft jobs. |
| Cloud / backup / audit | INCOMPLETE / NEEDS API / NEEDS APPROVAL | Browser-local records and non-overwriting restore exist. Cloud rules are deny-all drafts. Binary backup, immutable audit, real auth and transactional multi-user backend are not complete. |
| Legacy provider API | NEEDS API / NEEDS CREDENTIALS | Existing proxy contracts do not establish production authentication or delivery readiness. Do not deploy them. |
| Android | COMPLETED (first milestone) / NEEDS API | Separate project preserved; no shared live backend. |

## Validation plan

Use isolated fictional browser fixtures. Recheck all navigation, desktop/mobile, import/photos/profile/ID, present/absent links and exact parent mapping, provider fallback, microphone denial/supported recorder, library/fee/result/meeting draft events, closing vs confirmed checkout, scoped trip contacts, role-preview limitations, build and service tests. Do not call real parents or send real messages. Record unavailable physical-device/provider tests honestly.

Implementation outcomes and final test evidence are appended below when verified.
