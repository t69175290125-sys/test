import { test, expect } from '@playwright/test';
import { addToCart, loginAsDemo } from '../helpers';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await addToCart(page, 'p1');
    await addToCart(page, 'p5');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('checkout').click();
  });

  test('TC-CHK-01 empty form shows validation errors', async ({ page }) => {
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toHaveCount(3);
    await expect(page).toHaveURL(/#\/checkout$/);
  });

  test('TC-CHK-02 valid order shows a confirmation', async ({ page }) => {
    await page.getByTestId('full-name').fill('Ada Lovelace');
    await page.getByTestId('email').fill('ada@example.com');
    await page.getByTestId('address').fill('12 Analytical Street, London');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('confirmation-title')).toBeVisible();
    await expect(page.getByTestId('order-id')).toHaveText(/^ORD-\d{6}$/);
    await expect(page.getByTestId('order-total')).toHaveText('$59.00');
  });

  test('TC-CHK-03 cart is empty after placing an order', async ({ page }) => {
    await page.getByTestId('full-name').fill('Ada Lovelace');
    await page.getByTestId('email').fill('ada@example.com');
    await page.getByTestId('address').fill('12 Analytical Street, London');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('cart-badge')).toHaveText('0');
  });
});
