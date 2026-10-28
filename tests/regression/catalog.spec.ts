import { test, expect } from '@playwright/test';
import { loginAsDemo } from '../helpers';

test.describe('Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('TC-CAT-01 catalog lists all products with prices', async ({ page }) => {
    await expect(page.getByTestId('product-card')).toHaveCount(6);
    await expect(page.getByTestId('product-price').first()).toHaveText('$25.00');
  });

  test('TC-CAT-02 search filters products by name', async ({ page }) => {
    await page.getByTestId('search').fill('key');
    await expect(page.getByTestId('product-card')).toHaveCount(1);
    await expect(page.getByTestId('product-name')).toHaveText('Mechanical Keyboard');
  });

  test('TC-CAT-03 search with no match shows an empty state', async ({ page }) => {
    await page.getByTestId('search').fill('toaster');
    await expect(page.getByTestId('product-card')).toHaveCount(0);
    await expect(page.getByTestId('no-results')).toBeVisible();
  });
});
