import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';

test('public download page serves the exact APK and fits phone through desktop', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const metadata = await request.get('/downloads/android/release.json');
  expect(metadata.ok()).toBeTruthy();
  const release = await metadata.json();
  await page.goto('/download-app');
  await expect(page.getByRole('link', { name: 'Download test APK' })).toBeVisible();
  await expect(page.getByText('Test/debug APK — UI preview only.')).toBeVisible();
  await expect(page.getByText(release.sha256, { exact: true })).toBeVisible();
  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.locator('.app-phone-preview img')).toHaveJSProperty('naturalWidth', 411);
  }
  mkdirSync('artifacts/release', { recursive: true });
  await page.screenshot({ path: 'artifacts/release/download-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'artifacts/release/download-desktop.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download test APK' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(release.file);
  const bytes = readFileSync(await download.path());
  expect(bytes.length).toBe(release.bytes);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(release.sha256);
  expect(errors).toEqual([]);
  const blocked = await request.get('/downloads/android/local.properties');
  expect(blocked.status()).toBe(404);
});

test('download entry is available without login and missing release disables download', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Download Android App|Android ॲप डाउनलोड करा/ }).click();
  await expect(page).toHaveURL(/\/download-app$/);
  await page.route('**/downloads/android/release.json', route => route.fulfill({ status: 503, body: '' }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('release file is unavailable');
  await expect(page.getByRole('link', { name: 'Download test APK' })).toHaveCount(0);
});
