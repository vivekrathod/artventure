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
 * Improved with better waits and fallback strategies
 */
export async function signOut(page: Page) {
  try {
    // Strategy 1: Try to use the UI dropdown
    // Find user menu button by email pattern (contains @)
    const userMenuButton = page.locator('button').filter({ hasText: '@' }).first();
    
    const isVisible = await userMenuButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      // Click user menu button
      await userMenuButton.click();
      
      // Wait for dropdown to appear
      await page.waitForTimeout(500);
      
      // Click Sign Out button
      const signOutButton = page.locator('button:has-text("Sign Out")').first();
      await signOutButton.click();
      
      // Wait for sign out to complete (redirect or UI update)
      await page.waitForTimeout(1000);
      
      return;
    }
  } catch (e) {
    console.log('UI sign-out failed, using direct navigation:', e);
  }
  
  // Strategy 2: Fallback to direct navigation
  await page.goto('/auth/signout');
  
  // Wait for redirect to complete
  await page.waitForURL('/', { timeout: 5000 }).catch(() => {
    // Ignore timeout - might already be at /
  });
}

/**
 * Cleanup user created during test
 */
export async function cleanupUser(userId: string) {
  await deleteTestUser(userId);
}
