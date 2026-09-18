# Shared school backend — inactive, not deployed

Current web screens still persist to browser storage; Android opens preview screens. Adding an environment file does **not** connect those screens yet. No production data has been migrated.

The new JavaScript and Kotlin repositories share `../../shared/school-data-schema.json` and `schools/{schoolId}/{collection}/{recordId}` paths. They preserve student IDs, use a GR registry, check expected versions and atomically write revision snapshots to audit_logs. Both clients must use the same approved project and tenant.

Firestore and Storage rules are **draft, unverified rules**, replacing the previous deny-all placeholders. Do not deploy until emulator tests and security review pass. Membership is server-owned at `schools/{schoolId}/members/{uid}` with active, role, classIds and studentIds. No client can assign its own role. Protected files use authenticated storage paths, not public URLs.

## Checks

From this directory, with Java 21: `npm ci`, then `npm test`. This uses only loopback emulators and project `demo-gbs-school`; it does not deploy anything. The emulator download must complete first. The repository tests simulate clients, not Android UI interaction.

Independent queue tests: `node --test tests/outbox.test.mjs`.

Android checks from `android-app/GBSSCHOOL`: `./gradlew.bat assembleDebug testDebugUnitTest lintDebug --offline`.

## Remaining work

- Confirm approved project and tenant, register com.gbsschool.app in the same project and provide its public Android client configuration. Never package service-account credentials.
- Confirm staff sign-in method; wire authenticated login and provision memberships through a trusted administrative workflow. OTP is not implemented.
- Verify rules, disabled accounts, module/class scopes, protected files, conflicts and GR uniqueness. Existing tests cover only part of the matrix.
- Replace actual page storage calls with shared reads/listeners and queued writes. Preserve dirty forms; do not display queued edits as centrally saved. Remove preview role selection in authenticated mode.
- Wire Kotlin repository/queue/controller to real Compose screens, account lifecycle and network monitoring. Only one controller should own an account queue.
- Review migration of local records and binary attachments; preserve IDs and reconcile collisions. Do not automatically upload browser records upon sign-in.
- Integrate Excel batches, photos/documents, academic year, results and communication events. The repository currently mutates one record per transaction; batch integrity is pending.
- Run all ten requested scenarios on both actual clients.

Retries retain expected versions and never automatically rebase conflicts. Web multi-tab queue coordination and conflict-resolution UI are pending. Account-scoped Android queues must not be exposed in another user's UI. FCM delivery, provider jobs and telephony remain pending. The old HTTP contracts.js adapter is inactive, not a second backend.

See `../../docs/SHARED_DATA_IMPLEMENTATION_STATUS.md` for test results and exact changed files.

References: [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [query authorization](https://firebase.google.com/docs/firestore/security/rules-query), [emulator connections](https://firebase.google.com/docs/emulator-suite/connect_firestore).
