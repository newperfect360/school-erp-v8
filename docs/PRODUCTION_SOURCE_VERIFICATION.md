# Actual production source verification — 18 September 2026

**Local and the real Vercel site now serve the same frontend.** No screenshots, videos, traces, mockups, artifact images or alternate pages were created for this verification. No design changes were made.

## Requested exact report

**REAL LOCAL SOURCE:** `C:\Users\PAWAR\Documents\GitHub\school-erp-v8\school-erp-pro`

**REAL VERCEL SOURCE:** `newperfect360/school-erp-v8/school-erp-pro` at commit `493ffa28a3972fab65c401d22ad69b68fa2e8527`; published output `school-erp-pro/dist`. [Exact repository source](https://github.com/newperfect360/school-erp-v8/tree/493ffa28a3972fab65c401d22ad69b68fa2e8527/school-erp-pro). Vercel's internal absolute filesystem path is not exposed by the public deployment; a Windows path is not applicable to that build host.

**NEW DESIGN SOURCE:** `C:\Users\PAWAR\Documents\GitHub\school-erp-v8\school-erp-pro\src` — the same actual application, not an artifact/demo directory.

**PRODUCTION ENTRY FILE:** `school-erp-pro/dist/index.html`, referencing `/assets/index-CeMij3Sk.js` and `/assets/index-RRWYvEN0.css`. Its source entry is `school-erp-pro/src/main.jsx` → `src/App.jsx` → `src/pages/PortalHome.jsx` after login.

**NEW DESIGN ENTRY FILE:** `C:\Users\PAWAR\Documents\GitHub\school-erp-v8\school-erp-pro\src\main.jsx`, loaded by `school-erp-pro/index.html` in Vite development.

**VERCEL ROOT DIRECTORY:** Actual dashboard field remains **unverified** because CLI authentication is unavailable. The committed deployment workflow is written for repository root `.`: install `npm --prefix school-erp-pro ci`, build `npm run build`, output `school-erp-pro/dist`. Do not misrepresent this source-controlled configuration as an authenticated reading of the dashboard override.

**PRODUCTION BRANCH:** `main` is the remote branch containing the exact currently deployed SHA; local main now has that same SHA. Vercel's private production-branch configuration field was not read. The GitHub deployment ref is the commit SHA.

**CURRENT DEPLOYED COMMIT:** `493ffa28a3972fab65c401d22ad69b68fa2e8527` (`WEBC`).

**EXACT REASON FOR MISMATCH:** Before this deployment, Vercel served the repository-root legacy `index.html`/`app.js`, while localhost served the nested React application. They were two different frontend entry points. The earlier source-selection fix was subsequently committed and deployed through Git; production now serves the React build. No CSS redesign or moving JSX into the legacy app was necessary.

## Deployment evidence and timing

- Earlier production commit: `c87c7991e207bd23055471d892771296edf5f3d6`. Live HTML matched root legacy index.html exactly after line-ending normalization.
- New production deployment ID: `6516685315`, created `2026-09-18T03:10:04Z` (**08:40:04 IST**); successful status at `03:10:05Z`.
- [Deployment metadata](https://api.github.com/repos/newperfect360/school-erp-v8/deployments/6516685315) and [successful status](https://api.github.com/repos/newperfect360/school-erp-v8/deployments/6516685315/statuses).
- Immutable deployment URL: `https://school-erp-v8-osxmfhd10-perfect360.vercel.app`.
- Actual verified public alias: `https://school-erp-v8.vercel.app`.
- Remote main and current local HEAD both equal the deployed SHA.
- The new commit contains the earlier package.json/vercel.json source-selection changes. No new deployment was initiated by the agent in this verification turn; the Git-triggered deployment was observed and tested.

## Answers to the remaining diagnosis questions

1. Vite processes on ports 5178 and 5186 name `school-erp-pro/node_modules/vite/bin/vite.js`. Port 4178 runs Vite preview of `school-erp-pro/dist`.
2. Previously, yes: edits were in school-erp-pro while production served the root legacy app. That mismatch is resolved in the observed deployment.
3. Earlier images were captured by navigating to the actual app URLs. The artifact gallery displayed those captures; it was not the source application or production entry. It was incorrect to use local captures as proof that Vercel had changed; the earlier report marked live deployment pending.
4. Duplicate/old source still exists: root index.html/app.js and `src/pages/Dashboard.jsx`. App.jsx imports PortalHome for Home, not Dashboard.jsx. TeacherDashboard.jsx is a separate teaching workspace. These are distinguished from generated dist, review artifacts and the independent Android app. No legacy source was deleted or moved during diagnosis.
5. Current live HTML does not load legacy `style.css` or `assets/legacy-theme.css`. Live and locally built CSS hashes match, as do browser-computed layout and colors. There is no evidence of old CSS overriding the new frontend in a fresh live session.
6. The current live response reports a Vercel cache HIT, but its HTML and asset bytes match the current React build. A cache HIT does not establish stale content. The old frontend was a source-selection issue. An already-open old browser document was not inspected, so its current state must not be guessed. Opening the actual live URL afresh loads the verified React entry.
7. App.jsx uses state-based module navigation defined in `src/design/portalNavigation.js`; there is no App.tsx or React Router production entry. main.jsx also handles `/download-app`.

## Non-image verification performed

Executed `npm run build` from repository root, then:

```text
npx playwright test tests/live-source-verification.spec.js --reporter=line
3 passed (1.9m)
```

The test explicitly disables screenshots, videos and traces. It visits the real local and live URLs in fresh isolated browser contexts, never a demo/artifact page.

- Live index.html equals the production-preview index.html.
- Live JS `/assets/index-CeMij3Sk.js` SHA-256: `dfb0750dcdd5ba8edbe532316c2deca1de06627eeea6c4c732edf02451a9bee3`, identical locally.
- Live CSS `/assets/index-RRWYvEN0.css` SHA-256: `fa2033d2459796886af98f8eb3b725ea14e096293871b660c1079cca18899a2a`, identical locally.
- At 1440 × 1000 viewport, rendered header, navigation, hero and main-content text, geometry, colors and fonts match across development, local production preview and actual Vercel.
- All 149 menu destinations rendered without page errors on each of those three actual app URLs. This tests navigation, not every business function behind every menu.

Requested workflows passed on **both local production preview and the real Vercel site**:

| Workflow | Result |
| --- | --- |
| Student Master | Four primary actions visible and connected |
| Add Student | Added via actual form; visible in directory |
| Delete / Archive | Delete safely archives; restore and separate Archive action work |
| Excel Import | Uploaded real XLSX, validated, confirmed, student appears in directory |
| Download Excel Template | Downloaded and parsed workbook; expected fields present |
| Academic Year | Created 2027-28, activated it, changed student year |
| Class / Division Change | Reviewed actions changed class 8→9 and division A→B |

These existing workflows are browser-local, **not proof of a shared/live database**. Test records were confined to isolated test browser storage; outbound server mutations were blocked. The user's existing records and database were not changed.

## Files actually changed

Production source-mismatch fix, already deployed in `493ffa28...`:

- `package.json`: root dev/build/preview use school-erp-pro; legacy launch explicitly named.
- `vercel.json`: explicit React install/build/output configuration.
- `.vercelignore`: exclude unrelated Android source and review/test folders from CLI uploads.

This verification turn only:

- `school-erp-pro/tests/live-source-verification.spec.js` — new non-image live/local asset, layout, navigation and workflow checks.
- `docs/PRODUCTION_SOURCE_VERIFICATION.md` — this current report.
- `docs/LOCAL_VERCEL_SOURCE_AUDIT.md` — marks the earlier pending-deployment report as historical and links this verification.

No frontend JSX/CSS, database, Firebase configuration or image source was changed in this turn.

**LOCAL URL:** `http://127.0.0.1:4178/` (actual production build); `http://127.0.0.1:5178/` (same source in development).

**LIVE URL:** `https://school-erp-v8.vercel.app/`.

**DEPLOYED COMMIT:** `493ffa28a3972fab65c401d22ad69b68fa2e8527`.

**VERCEL ROOT:** source-controlled build workflow expects `.`; dashboard field unverified, as disclosed above.
