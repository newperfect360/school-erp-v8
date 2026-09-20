import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`production login fails closed without backend configuration at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByText('School sign-in configuration is required.', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Role preview')).toHaveCount(0);
    await expect(page.getByText('LOCAL SCHOOL REVIEW', { exact: false })).toHaveCount(0);
    const password = page.getByLabel('Password', { exact: true });
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill('unconfigured@example.invalid');
    await password.fill(crypto.randomUUID());
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('not configured');
    await expect(page.locator('.portal-shell')).toHaveCount(0);
    await page.getByRole('button', { name: 'Forgot Password', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Forgot Password', exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Submit password request' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('reset link opens password reset without granting a session', async ({ page }) => {
  await page.goto('/?mode=resetPassword&oobCode=invalid-expired-reference');
  await expect(page.getByRole('heading', { name: 'Reset Password', exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirm new password')).toBeVisible();
  await expect(page.locator('.portal-shell')).toHaveCount(0);
});
