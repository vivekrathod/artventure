import { Page } from '@playwright/test';
import { createTestUser, createTestAdmin, deleteTestUser } from './database';

/**
 * Create a test user via admin API and sign them in via the browser
 */
export async function createAndSignInUser(page: Page, email?: string) {
  const { user, password } = await createTestUser(email);

  // Sign in through the UI
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', user.email!);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL('/');

  return { user, password };
}

/**
 * Create an admin user via admin API and sign them in via the browser
 */
export async function createAndSignInAdmin(page: Page) {
  const { user, password } = await createTestAdmin();

  // Sign in through the UI
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', user.email!);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL('/');

  return { user, password };
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page) {
  // Try to find and click sign out
  const userMenu = page.locator('[data-testid="user-menu"], button:has-text("@")');

  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.click('text=Sign Out');
  } else {
    // Navigate to sign out directly
    await page.goto('/auth/signout');
  }
}

/**
 * Cleanup user created during test
 */
export async function cleanupUser(userId: string) {
  await deleteTestUser(userId);
}
