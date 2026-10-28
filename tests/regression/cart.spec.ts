import { test, expect } from '@playwright/test';
import { addToCart, loginAsDemo } from '../helpers';

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('TC-CART-01 cart badge shows the total quantity', async ({ page }) => {
    await addToCart(page, 'p1', 2);
    await addToCart(page, 'p3');
    await expect(page.getByTestId('cart-badge')).toHaveText('3');
  });

  test('TC-CART-02 changing quantity updates the subtotal', async ({ page }) => {
    await addToCart(page, 'p1');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('inc-p1').click();
    await expect(page.getByTestId('qty-p1')).toHaveText('2');
    await expect(page.getByTestId('subtotal')).toHaveText('$50.00');
  });

  test('TC-CART-03 removing the last item empties the cart', async ({ page }) => {
    await addToCart(page, 'p2');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('remove-p2').click();
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('TC-CART-04 promo code SAVE10 gives 10% off', async ({ page }) => {
    await addToCart(page, 'p4');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('promo-input').fill('save10');
    await page.getByTestId('promo-apply').click();
    await expect(page.getByTestId('promo-message')).toHaveText('Promo code SAVE10 applied');
    await expect(page.getByTestId('discount')).toHaveText('$24.90');
    await expect(page.getByTestId('total')).toHaveText('$224.10');
  });

  test('TC-CART-05 unknown promo code is rejected', async ({ page }) => {
    await addToCart(page, 'p4');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('promo-input').fill('FREESTUFF');
    await page.getByTestId('promo-apply').click();
    await expect(page.getByTestId('promo-message')).toHaveText('Invalid promo code');
    await expect(page.getByTestId('discount')).toHaveText('$0.00');
  });
});
