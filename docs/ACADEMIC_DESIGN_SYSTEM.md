# Vidyalaya — academic design system

Status: proposed core design; awaiting user approval before remaining module layouts.

## Visual direction

School-first identity: crest, full configured school name, academic year, campus
illustration, class groupings, teacher assignments and a readable daily register. The
fallback crest is a proposed design mark; a saved school logo takes precedence.

| Foundation | Definition |
| --- | --- |
| Body typography | Segoe UI / Nirmala UI / system sans; readable Marathi fallback; no remote font dependency |
| Display typography | Georgia with Marathi fallback for campus/login editorial text only |
| Type scale | 27–32 page heading; 24–36 editorial; 15–16 panel title; 12–14 body; 10–11 secondary |
| Colors | Ink `#203650`; canvas `#f5f6f9`; white surfaces; academic blue `#2d527c`; restrained gold `#b99454` |
| Semantic colors | Sage for recorded present/enrolled; warm clay for absence; amber for pending/action; slate for neutral |
| Spacing | 4, 8, 12, 16, 24, 32px tokens; page padding 32px desktop / 16px phone |
| Panels | 12px radius; 1px border; minimal shadow; headings with contextual action |
| Buttons | Primary blue; secondary outlined; text actions; icon actions have names and visible focus |
| Inputs | 42px minimum; 7px radius; descriptive labels; focus ring; no placeholder-only core forms |
| Tables | Compact light header; stable identity column; mobile register becomes cards; directory retains essential columns |
| Status badges | Text plus semantic color; no color-only attendance interpretation |
| Icons | One local 24px line-icon family, 1.65px stroke; custom SVG school illustration |
| Navigation | Five school-specific groups; selected state; searchable modules; phone bottom bar; Escape/focus-contained drawer |

Reusable primitives: `PageHeading`, `Panel`, `EmptyState`, `Avatar`, `SchoolMark`,
`LanguageSwitch`, `AcademicCalendar`. Tokens and shared selectors live in
`src/design/design-system.css`. Legacy page styles remain during the staged rollout.

## Interaction rules

- Working data controls, no fabricated school totals, improvement percentages or charts.
- Core pages distinguish missing records from zero totals and unmarked attendance.
- Student profiles are opened by immutable student ID; QR data contains only that ID.
- EN/मराठी updates presentation and document language; legacy/source fields are unchanged.
- Inline creation/import keeps the directory focused on finding students first.
- Profile sections preserve record identity; teacher selection is explicitly a preview,
  not a credential or role switch.
- Contact links continue to use Student Master and log requests, not assumed delivery.

## Mobile behavior

Desktop: fixed-width navigation and multi-column workspace. Tablet: drawer navigation
and fewer dashboard columns. Phone: 16px page margins, visible bottom navigation,
44px primary/contact touch controls, register cards, stacked profile sections. Drawer
focus is contained; Escape returns focus to its opener. Reduced-motion preference is
respected. No sensitive contact information is included in the new QR payload.

## Later patterns, not falsely presented as completed

Use the same panels/form structure for OTP, notifications, QR camera and staff profile
after the auth/API phase. Async loading, permission-denied states and modal forms must
be connected to actual services; do not simulate successful OTP or provider delivery.
New modal dialogs should use native dialog semantics or equivalent focus management,
Escape dismissal, labelled titles and a single clear primary action.
