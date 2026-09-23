# Temporary local development login

Review URL: http://127.0.0.1:5315/
Username: admin. Password: admin1234. These are intentionally public local testing credentials, never a Firebase account.

Enabled through `DEV_ADMIN_LOGIN=true` in ignored `school-erp-pro/.env.local`. Restart Vite after changing the flag. Set false to disable. Vite must run its development server in development/test mode and the browser host must be localhost, 127.0.0.1 or IPv6 loopback. Production builds always alias to a disabled implementation, even with the flag true or a development build mode. The temporary credential is absent from the production JS bundle.

The in-memory session grants all existing navigation modules and displays DEVELOPMENT / TEST MODE. Reload or logout ends the session. The account bypasses tenant lookup only locally, and Firebase client creation is blocked in this mode, preserving production accounts/data. Existing browser-local record behavior is retained on this separate review origin; no records/configuration were deleted. Firebase password/permission editing is intentionally unavailable to this local account. Disable development mode to test real Firebase authentication.

Validation: actual Edge browser invalid-password rejection, successful login, dashboard and 40 distinct portal module destinations, mobile Students/Attendance navigation, badge, logout, no page errors, zero Firebase requests from the development session. Production preview retains Email login without the development option; production JS does not contain the temporary password. Build passed; lint passed with seven pre-existing warnings. Module accessibility does not imply external messaging, cloud synchronization or every business action has passed.

Test: `node tests/development-admin.mjs` from school-erp-pro with dev server at 5315 and built preview at 4186. Production authentication source remains intact; no Firebase/Vercel deployment or rule modification was performed for this feature.
