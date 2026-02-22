import { test, expect } from '@playwright/test';
import { createAndSignInUser, signOut, cleanupUser } from '../helpers/e2e';
import { createTestUser } from '../helpers/database';

test.describe('Authentication Flow', () => {
  let testUserId: string;
  let testEmail: string;
  let testPassword: string;

  // Create test user via admin API before tests
  test.beforeAll(async () => {
    const { user, password } = await createTestUser();
    testUserId = user.id;
    testEmail = user.email!;
    testPassword = password;
  });

  // Cleanup after all tests
  test.afterAll(async () => {
    if (testUserId) {
      await cleanupUser(testUserId);
    }
  });

  test('should sign in existing user', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Should redirect to home
    await expect(page).toHaveURL('/');

    // Should be signed in
    await expect(page.locator('text=' + testEmail)).toBeVisible();
  });

  test('should sign up new user via admin API', async ({ page }) => {
    // Create user via admin API (bypasses email validation)
    const { user, password } = await createTestUser();

    // Sign in through the UI to verify account works
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', user.email!);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');

    // Should show user email in header
    await expect(page.locator('text=' + user.email!)).toBeVisible();

    // Cleanup
    await cleanupUser(user.id);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid|incorrect|failed/i')).toBeVisible();
  });

  test('should sign out user', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL('/');

    // Verify user is signed in (email visible in header)
    await expect(page.locator(`text=${testEmail}`)).toBeVisible({ timeout: 5000 });

    // Sign out using helper
    await signOut(page);

    // Should be redirected to home page
    await expect(page).toHaveURL('/', { timeout: 5000 });

    // Should be signed out - "Sign In" button should be visible
    await expect(page.locator('a:has-text("Sign In")').first()).toBeVisible({ timeout: 5000 });
    
    // User email should no longer be visible
    await expect(page.locator(`text=${testEmail}`)).not.toBeVisible();
  });

  test('should protect account page when not logged in', async ({ page }) => {
    await page.goto('/account');

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
