# Production UDISE mapping — 24 September 2026

Owner-supplied UDISE `27190113523` is mapped to existing `schools/gbs-school` in Firebase project `school-managment-8c102`.

Applied using a field-masked, updateTime-preconditioned Firestore commit:

- tenantId: gbs-school
- schoolId: gbs-school
- udise: 27190113523
- status: ACTIVE

Verified all other 14 backed-up documents retained their updateTime. No operational records, passwords, authentication accounts or security rules changed. The update preserved existing school fields.

Backup: `school-erp-pro/backend/production-backup-1790222321659.local`; SHA256 `a73e3d02620f1c38956eeb50750ab0381201007bf6cba98d3b225b6d17610e9f`.

Existing enabled password-provider account for the owner was reverified as UID `F2k0InkD73eV9bDjXRNzl1Bw34j1`. Its existing active membership remains `SUPER_ADMIN`. It was deliberately not renamed to `SCHOOL_SUPER_ADMIN`: current published rules/repository do not support that name, and changing it alone would break access.

Vercel `perfect360/school-erp` has no production environment variables. The production frontend still explicitly rejects multi-school UDISE login. No environment mutation or deployment was performed in this checkpoint.

Trusted production identifier resolution and user administration are not implemented. Firebase billing readback is `billingEnabled: false`; Firebase-hosted Cloud Functions deployment would require owner-authorized billing activation. An alternative trusted Vercel runtime identity is not configured. Firebase Email/Password itself does not require upgrading solely to sign in.

The owner selected that they know the production password. No reset is required based on that response. Actual live sign-in remains untested; no password was requested or obtained.

Production login, dashboard, school-specific role rollout and end-to-end isolation are NOT PASS. Existing activation rules retain broad legacy authenticated access, which must be addressed and tested before claiming multi-school security.
