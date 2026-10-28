import { expect, type Page } from '@playwright/test';

export const VALID_USER = { username: 'demo', password: 'demo123', name: 'Demo User' };

export async function login(page: Page, username = VALID_USER.username, password = VALID_USER.password) {
  await page.goto('/#/login');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('login-submit').click();
}

export async function loginAsDemo(page: Page) {
  await login(page);
  await expect(page.getByTestId('welcome')).toHaveText(`Hello, ${VALID_USER.name}`);
}

export async function addToCart(page: Page, productId: string, times = 1) {
  for (let i = 0; i < times; i++) await page.getByTestId(`add-${productId}`).click();
}
