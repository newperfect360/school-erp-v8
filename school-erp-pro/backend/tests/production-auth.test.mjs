import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { chromium } from '../../node_modules/@playwright/test/index.mjs';

test('web Firebase login, membership, recovery, password change, logout and timeout in isolated emulators', { timeout: 180000 }, async () => {
  const projectId = 'demo-gbs-school', base = 'http://127.0.0.1:5297';
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Must run inside Firebase emulators:exec');
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  const email = `admin-${crypto.randomUUID()}@example.invalid`;
  let password = crypto.randomUUID() + '!Aa7';
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-only', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const account = await response.json(); assert.ok(account.localId, 'Emulator account created');
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members', account.localId), {
    active: true, passwordSetupComplete: true, role: 'Super Admin', modules: ['Dashboard'], resources: [], classIds: [], studentIds: [],
  }));
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'schools/auth-school/members/staff-member'), {
    active: true, passwordSetupComplete: true, role: 'Teacher', modules: [], resources: [], classIds: [], studentIds: [],
  }));
  await assertFails(updateDoc(doc(env.authenticatedContext('staff-member').firestore(), 'schools/auth-school/members/staff-member'), { role: 'Super Admin' }));
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5297', '--strictPort'], {
    cwd: new URL('../../', import.meta.url), stdio: 'ignore', windowsHide: true,
    env: { ...process.env, VITE_SCHOOL_DATA_MODE: 'firebase', VITE_SCHOOL_ID: 'auth-school', VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_API_KEY: 'emulator-only', VITE_FIREBASE_APP_ID: 'emulator-web', VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`, VITE_FIREBASE_EMULATORS: 'true' },
  });
  let browser;
  try {
    for (let attempt = 0; attempt < 60; attempt++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage(); await page.goto(base);
    const login = async () => {
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Login', exact: true }).click();
      await page.locator('.portal-shell').waitFor();
    };
    await login();
    assert.equal(await page.locator('[data-nav="Students"]').count(), 0, 'Unassigned module hidden');
    await page.getByRole('button', { name: 'Account / Change Password' }).click();
    await page.getByRole('heading', { name: 'Assigned module permissions' }).waitFor();
    await page.getByLabel('Staff account', { exact: true }).selectOption('staff-member');
    await page.getByRole('group', { name: 'Visible modules' }).getByLabel('Dashboard', { exact: true }).check();
    await page.getByRole('button', { name: 'Save staff permissions' }).click();
    await page.getByText('Permissions saved to the school backend.', { exact: true }).waitFor();
    await page.getByLabel('Current password', { exact: true }).fill(password);
    const next = crypto.randomUUID() + '!Aa7';
    await page.getByLabel('New password', { exact: true }).fill(next);
    await page.getByLabel('Confirm new password').fill(next);
    await page.getByRole('button', { name: 'Change Password', exact: true }).click();
    await page.getByRole('button', { name: 'Login', exact: true }).waitFor();
    password = next; await login();
    await page.getByRole('button', { name: 'Logout', exact: true }).first().click();
    await page.getByRole('button', { name: 'Forgot Password', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Submit password request' }).click();
    await page.getByText('If this account is eligible, a reset link will be sent to its email address.').waitFor();
    const codes = await (await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`)).json();
    const code = codes.oobCodes.findLast(item => item.email === email && item.requestType === 'PASSWORD_RESET');
    assert.ok(code, 'Emulator reset request created');
    await page.goto(`${base}/?mode=resetPassword&oobCode=${encodeURIComponent(code.oobCode)}`);
    password = crypto.randomUUID() + '!Aa7';
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm new password').fill(password);
    await page.getByRole('button', { name: 'Submit password request' }).click();
    await page.getByRole('button', { name: 'Login', exact: true }).waitFor();
    await page.clock.install(); await login(); await page.clock.fastForward(16 * 60_000);
    await page.getByRole('button', { name: 'Login', exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 }); await login();
    await page.getByRole('button', { name: 'Logout', exact: true }).first().click();
    await page.getByRole('button', { name: 'Login', exact: true }).waitFor();
    await login();
    await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'schools/auth-school/members', account.localId), { active: false }));
    await page.locator('.portal-shell').waitFor({ state: 'detached' });
  } finally { await browser?.close(); server.kill(); await env.cleanup(); }
});
