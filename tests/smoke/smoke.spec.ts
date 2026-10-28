import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../helpers';

// Fast checks run after every deployment: is the shop up and usable at all?
test.describe('Smoke', () => {
  test('TC-SMOKE-01 shop is reachable and shows the sign-in page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Demo Shop');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('TC-SMOKE-02 demo user can sign in and see the catalog', async ({ page }) => {
    await loginAsDemo(page);
    await expect(page.getByTestId('product-card').first()).toBeVisible();
  });
});
