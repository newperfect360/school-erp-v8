# Contacts, academic years and educational design review

Scope: the current existing web project, local visual review only. No production deployment, database migration, Android changes or live parent communication. Larger backend development is paused for design approval.

## Review

- [Running portal](http://127.0.0.1:5185/) — local review login `admin` / `123456`.
- [Desktop/mobile gallery](../school-erp-pro/artifacts/education-refresh/index.html).
- The supplied attachment contained text only. Reference screenshot paths were requested but not supplied during this pass. The design follows the described institution header, horizontal dropdowns, announcement bar, event slider and information-card hierarchy. It does not claim a visual comparison against unavailable screenshots.
- No real school photographs were supplied. The original campus illustration remains the fallback. Admin gallery upload/reorder/hide/remove supports approved photographs; event dates, slide dots, previous/next, auto-slide and pause controls are available.

## What changed

- Centered institution/school masthead, left logo and a right badge area. The badge shows configured recognition/affiliation if provided; otherwise it identifies the school office without claiming accreditation.
- A prominent current-year control beside language, notice and profile actions. Header selection opens the chosen year's review; changing the current year requires the explicit Activate action.
- Navy desktop navigation with About, Students, Academics, Attendance, Exam, Certificates, Trip, Sports, Library, Parents, Reports, Facilities and More. Staff/scholarship tools remain available under More. Existing routes remain accessible.
- At widths up to 900px, navigation becomes a hamburger/accordion menu instead of squeezing the desktop row into the screen. Sticky year/language controls and the existing bottom quick actions remain available.
- Blue announcement bar, larger campus/event hero, date/caption/dots and three school information cards before operational metrics.
- Student directory, profile, Attendance and new contact/year screens share the navy/white/light-neutral theme, with restrained gold and green accents.
- Selecting Student Master from a profile now returns to the directory instead of retaining that nested profile view.

## Contact behavior

- Student entry has separate Father, Mother and Emergency sections. Emergency includes name, relation and mobile. Optional father/mother WhatsApp, general WhatsApp, guardian and alternate contacts remain distinct.
- Three contact slots always exist. Unavailable numbers may remain blank; at least one parent/emergency/legacy primary number is required for manual student entry. Missing relatives' numbers are never invented or copied from another person.
- Excel includes Father Name/Mobile, Mother Name/Mobile, Emergency Contact Name, Emergency Relation, Emergency Mobile and WhatsApp Number. Old `Emergency Contact` headers continue mapping to the same existing emergency phone field (`emergencyContact`), avoiding a competing data source.
- Contact cards provide Call Father/Mother/Emergency, SMS Father/Mother/Emergency and WhatsApp Father/Mother. Father/mother WhatsApp overrides are used when provided. Existing general parent selectors also include Emergency Contact.
- Cards appear on the profile, absent follow-up panel, expandable attendance-row panel, participant contact section in Trips and the Parents → Emergency Contacts directory.
- Contact actions re-read Student Master and channel switches, save the intended recipient/action, then use supported `tel:`, `sms:` or WhatsApp device links. They do not claim actual call connection or delivery. API delivery remains unconfigured.
- Card numbers are masked until Show numbers; links necessarily contain the dialer/composer destination. Existing internal history/office screens may show full contact details. This remains a local review application, not a publicly deployable authorized staff system.

## Academic year behavior and limits

- Academics → Academic Years creates non-overlapping dated years and shows previous/current/next created years. Admin/Super Admin/Headmaster UI roles can activate, close, archive and reopen; teachers see the current year without the header switching control. These are UI permissions until real server authorization is connected.
- Activating a year changes configuration only. It never changes Student IDs, student enrollment years or existing records, and never silently promotes a class.
- Year-end promotion uses the existing preview/confirmation lifecycle workflow. Per-student decisions now also include Transferred and Passed Out.
- New Student Master, homework, results, fee ledger, scholarship, sports, trip, library-loan and equipment-loan rows receive an academic-year tag. Existing rows retain their original tags. Dated entries use the applicable year dates; otherwise the current year is used.
- Attendance saves maintain a separate date-to-year index without changing the existing student/date attendance structure. New entries into closed/archived years and changes to attendance in those years are blocked.
- The central year-review table combines these records with previous enrollment snapshots. Older dated rows are explicitly labelled Date-based view; undated legacy rows are Unassigned. There is no bulk relabelling of historical data.
- Operational screens retain their existing date/class filters. The header year selector opens cross-module year review; it is not a hidden global filter that makes every existing module read-only. Full closed-year edit restrictions across all legacy modules, secure server transactions and multi-user authorization remain future backend work after visual approval.
- Existing JSON backups include the new year collections; binary assets still require separate preservation.

## Validation

- Final focused run: **15 browser tests passed**, including contact mapping/import, year activation preserving Student Master, teacher controls, every dropdown destination, 1440/1024/768/390/360px layout checks, notices, gallery ordering and core student/archive/restore/backup workflows.
- Earlier related run also passed absence communication, digitalization and lifecycle suites. Initial review failures revealed same-page navigation retention and tablet overflow; these were corrected. A gallery test interrupted by development hot reload passed in the final stable run.
- **17 service tests passed**, including year validation/overlap, preserved prior tags, closed-year new-record rejection and existing lifecycle/import calculations.
- **9 root service/API tests passed**. No real parent was contacted; navigation was intercepted in browser tests.
- Build passed. Lint has the existing six Fast Refresh warnings; no errors. The large JavaScript bundle warning remains a future optimization item.
- Desktop home/profile and mobile home/menu screenshots were visually inspected. Physical device call, messaging and screen-reader testing remain outside this automated browser review.

Stopped for visual approval. Nothing deployed.
