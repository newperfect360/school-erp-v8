# Authentication activation review

Confirmed project: school-managment-8c102 (288441699527).
Tenant: gbs-school. Existing designated account is enabled with Email/Password provider; UID F2k0InkD73eV9bDjXRNzl1Bw34j1. No duplicate account or password mutation.

Current live rules still permit every authenticated user to write all documents. The tenant membership does not yet exist. The owner's earlier pause remains effective pending explicit approval of the concrete activation change.

## Reviewable candidate

`school-erp-pro/backend/firestore.activation.rules` incorporates the existing school-scoped permission rules and adds a legacy compatibility match excluding the entire schools namespace. This prevents the legacy allow rule from also authorizing membership writes. Authenticated access outside schools remains as before, including nested legacy documents. This is temporary compatibility, NOT final production security for legacy data.

The targeted emulator test in `backend/tests/activation-security.test.mjs` passes: legacy CRUD/read behavior preserved, unauthenticated legacy read denied, Super Admin membership read and staff-grant edit allowed, student create/read/update/archive allowed through audited repository transactions, outsider tenant access denied, self-escalation/Super Admin tampering/nested membership bypass denied. Only isolated fixtures were changed. Admin SDK operations bypass security rules and must not be counted as actual user login tests.

Fresh private backup: `school-erp-pro/backend/production-backup-1790137530552.local`, 13 legacy documents plus current rules and release metadata. SHA-256 `3c30a4a5c6e2b880a7239e3f88887964c3d00d2c8ca5b5a3be3565b299eafb62`. Readback verified. Source timestamps/rules release must be rechecked before publication; stop on drift. Do not automatically restore broad legacy permissions to the schools namespace on failure; pause activation and repair the scoped candidate while keeping existing records intact.

## Pending approved execution

1. Obtain approval to publish this candidate and provision membership, superseding the earlier production-write pause.
2. Verify live project, empty tenant state, Auth UID, backup and rule source have not changed. Publish only the reviewed candidate, then verify the live rule source.
3. Create tenant and membership using trusted administrative access with create-only preconditions. Use existing schema (role SUPER_ADMIN, active, passwordSetupComplete, modules/resources/classIds/studentIds). Verify password-setup state rather than equating provider existence with a successful login. Never store credentials in Firestore.
4. Test actual user sign-in privately on Web and Android, including verified membership; do not ask for a password in chat. Recovery email delivery and reset must be verified by the account owner. Do not send unsolicited password-reset emails.
5. Shared operational repository integration remains required for actual Web/Android synchronization. Authentication configuration does not remove browser-local operational storage.

No production rules were deployed and no membership was provisioned during this review preparation. Existing students, teachers, attendance and notices were not modified.

Full isolated Firebase Emulator suite result: 13 passed, 0 failed. This includes the activation candidate, browser login/recovery/password change/logout/timeout, canonical Super Admin security matrix, school/class isolation, audit integrity, operational browser audit and calling. Real-account production Web/Android login, reset email delivery and live synchronization remain unverified.
