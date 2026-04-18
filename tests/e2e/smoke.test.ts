import { test, expect } from '@playwright/test';

test('@smoke health endpoint returns ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { status: string };
  expect(body.status).toBe('ok');
});

test('@smoke /en renders hero heading', async ({ page }) => {
  await page.goto('/en');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
});

test('@smoke /es renders hero heading', async ({ page }) => {
  await page.goto('/es');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
});
