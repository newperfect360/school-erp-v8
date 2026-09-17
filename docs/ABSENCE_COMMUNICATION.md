# Absence communication

The React Attendance page resolves contacts by Student Master ID. It supports father,
mother, guardian, primary parent and alternate numbers, manual WhatsApp/SMS composers,
native `tel:` dialer links, selected-recipient queues, CSV export, audio-file sharing,
call remarks, dated follow-ups and Marathi/English automatic notification drafts.

History is stored under `erp_pro_absence_communications`; follow-ups use a composite
attendance-date/student-ID key in `erp_pro_absence_followups`. Actions are saved before
opening external apps. A failed write cancels the action. Composer/dialer requests never
claim confirmed delivery, call connection, duration or telecom outcome. Remarks and
parent responses are staff-entered. Audio share sheets cannot guarantee a recipient;
the teacher selects the recipient in the external app. Unsupported devices offer a
download for manual attachment. Audio files stay in memory and are not put in storage.

## Current deployment boundary

This project currently has a hard-coded local demo administrator login and browser
storage, not authenticated server accounts, tenant isolation or private server storage.
Communication UI appears only inside the existing login view; contact details are not
added to public pages, and are excluded from printing. This does not turn the existing
demo login into production authorization. Use synthetic data in publicly accessible demos.
History persists only in that browser. Clearing browser storage removes it.

Automatic delivery and true bulk dispatch remain unavailable until an authenticated
provider integration exists. Bulk queues require one explicit composer opening per
recipient; they do not launch timed pop-ups or mark messages sent. Automatic draft
preparation is configurable; repeated Absent markings do not duplicate the dated draft.

## Future provider adapter

`createVoiceCallJob` in `src/services/absenceCommunication.js` defines the versioned,
provider-independent voice job contract and idempotency key. No provider is hard-coded
and no voice job is dispatched by the browser. Before enabling delivery:

1. Establish server authentication, school membership, teacher class permissions and
   administrator-only notification settings. Resolve student/contact IDs server-side;
   reject arbitrary client-supplied phone numbers and actor identities.
2. Persist jobs and history in private school-scoped storage. Apply the idempotency key
   as a unique constraint, recheck absence before dispatch, and record retries/failures.
3. Implement a server-only adapter with `sendText`, `sendAudio`, `placeVoiceCall` and
   verified provider callback handling. Store credentials in server environment variables
   such as `COMMUNICATION_PROVIDER_TOKEN` and `TELEPHONY_PROVIDER_TOKEN`, never `VITE_*`,
   localStorage, URLs or logs. Validate provider endpoints against a server allowlist.
4. Have an authenticated worker process approved jobs, with consent policy, cancellation,
   retry limits and rate limits. Only verified provider receipts can assert delivery or
   actual call status. No browser callback can mark a job delivered.

## Verification

Run `npm run build` and `npx playwright test tests/absence-communication.spec.js` from
`school-erp-pro` with the dev server running. Tests intercept native navigation; no real
parents are contacted. Coverage includes 390px mobile layout, same-name students with
different IDs, exact parent targets, call remarks and follow-up persistence, date
isolation, Marathi templates, invalid contacts, deleted master records, selected bulk
queues, audio cancellation and storage failure. Physical Android/iOS dialer and installed
messaging app behavior still requires a real-device acceptance check.

Audio capability checks follow the [Web Share API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
