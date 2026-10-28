import { test, expect } from '@playwright/test';
import { login, loginAsDemo } from '../helpers';

test.describe('Authentication', () => {
  test('TC-AUTH-01 valid user can sign in', async ({ page }) => {
    await loginAsDemo(page);
    await expect(page).toHaveURL(/#\/products$/);
  });

  test('TC-AUTH-02 wrong password shows an error', async ({ page }) => {
    await login(page, 'demo', 'wrong-password');
    await expect(page.getByTestId('login-error')).toHaveText('Invalid username or password');
    await expect(page).toHaveURL(/#\/login$/);
  });

  test('TC-AUTH-03 user can log out', async ({ page }) => {
    await loginAsDemo(page);
    await page.getByTestId('logout').click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('TC-AUTH-04 protected pages redirect to sign-in', async ({ page }) => {
    await page.goto('/#/cart');
    await expect(page).toHaveURL(/#\/login$/);
  });
});
