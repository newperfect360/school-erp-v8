import { test, expect } from '@playwright/test';
import { nav } from './portal-navigation.mjs';

test('backup page downloads a dated file and verifies the saved copy', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByLabel('Username', { exact: true }).fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await nav(page, 'Backup');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download dated cleanup backup with attachments' }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toContain('school-cleanup-backup-');
  await page.getByLabel('Verify saved cleanup backup').setInputFiles(await file.path());
  await expect(page.getByRole('status').filter({ hasText: 'Saved backup verified:' })).toBeVisible();
  await expect(page.getByText('No reset is enabled:', { exact: false })).toBeVisible();
});

test('cleanup archive includes attachment bytes, detects corruption, and never changes source records', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { saveAsset, readAsset } = await import('/src/services/assets.js');
    const { createCleanupBackup, verifyCleanupBackup } = await import('/src/services/cleanupBackup.js');
    // Isolated Playwright context only. No students or production records are created.
    const attachment = await saveAsset(new File(['backup-byte-check'], 'backup-check.pdf', { type: 'application/pdf' }));
    const before = JSON.stringify(Object.fromEntries(Object.entries(localStorage)));
    const { archive, filename } = await createCleanupBackup();
    const verified = await verifyCleanupBackup(JSON.stringify(archive), archive.sha256);
    const payload = JSON.parse(archive.payload);
    const bytes = await (await fetch(payload.assets[0].dataUrl)).text();
    let corruptRejected = false, wrongFileRejected = false;
    try { await verifyCleanupBackup(JSON.stringify({ ...archive, payload: archive.payload + ' ' })); } catch { corruptRejected = true; }
    try { await verifyCleanupBackup(JSON.stringify(archive), 'different-backup'); } catch { wrongFileRejected = true; }
    return { filename, verified, bytes, corruptRejected, wrongFileRejected,
      unchanged: before === JSON.stringify(Object.fromEntries(Object.entries(localStorage))),
      original: await (await readAsset(attachment.id)).blob.text() };
  });
  expect(result.verified.assets).toBe(1);
  expect(result.filename).toMatch(/^school-cleanup-backup-.*\.json$/);
  expect(result.bytes).toBe('backup-byte-check');
  expect(result.original).toBe(result.bytes);
  expect(result.unchanged).toBe(true);
  expect(result.corruptRejected).toBe(true);
  expect(result.wrongFileRejected).toBe(true);
});
