import { test, expect } from '@playwright/test';

test.describe('Smoke tests @smoke', () => {
  test('English landing page renders hero title', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Win more live poker');
  });

  test('Spanish landing page renders hero title', async ({ page }) => {
    await page.goto('/es');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('poker en vivo');
  });

  test('Root redirects to locale', async ({ page }) => {
    const response = await page.goto('/');
    // Should redirect to /en or /es
    const url = page.url();
    expect(url).toMatch(/\/(en|es)$/);
    expect(response?.status()).toBeLessThan(400);
  });
});
