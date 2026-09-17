# Shared school backend preparation — not deployed

Current React persistence is browser-local. The separate Android app is a design preview. Neither is represented as a production authenticated school system.

`src/backend/contracts.js` defines an inactive token-based API adapter. Its school/student IDs must be shared with Android. Implement endpoints under `/v1/schools/{schoolId}/{resource}` using verified Firebase ID tokens, server-owned membership and explicit roles. Never trust a client role, actor, school ID or class assignment without authorization. Use optimistic versions and idempotency keys for imports, issuance, lending and communication jobs.

School membership fields: `uid`, `schoolId`, `role`, `active`, `classIds`, `subjectIds`. Only an authorized privileged server workflow can change membership. OTP must include expiry, attempt limits, resend delay, replay protection and appropriate SMS-provider setup; forgotten passwords must use verified identity recovery. Do not implement a browser-generated OTP or store staff passwords locally.

Use a server repository for cross-document transactions, immutable actor-aware audit events, soft deletes with restore history, managed file uploads and verified delivery callbacks. Attachment endpoints validate content/type/size, ownership and retention; return short-lived links. Browser audio-share or composer opening is not delivery evidence. Telephony adapters remain provider-neutral; secret credentials come from server environment configuration.

The draft rules below default to **no access**. They are scaffolding, not a ready deployment: implement and emulator-test tenant, role, class/subject scope, disabled-user and file rules before enabling any access. No production Firebase file, root config or existing data is modified. No destructive migration is prepared or executed.

Before integration, obtain the approved staging project, official school/tenant identity, provider configuration and exact schema. Reconcile both legacy catalogs without losing IDs. Export and test restoration of browser records **and IndexedDB attachments**, map schema versions, run staging tests, then request approval for a concrete migration/rollback plan. Browser JSON backups do not include binary attachments.

References: [Firebase Auth](https://firebase.google.com/docs/auth), [Firestore rules](https://firebase.google.com/docs/firestore/security/get-started), [Storage rules](https://firebase.google.com/docs/storage/security), [Emulator testing](https://firebase.google.com/docs/rules/unit-tests).
