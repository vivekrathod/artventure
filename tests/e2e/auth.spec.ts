import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const randomId = Math.random().toString(36).substring(2, 8);
  const testEmail = `testuser${randomId}@example.com`;
  const testPassword = 'TestPassword123!';

  test('should sign up new user', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');

    // Should show user email in header
    await expect(page.locator('text=' + testEmail)).toBeVisible();
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

    // Click user menu
    await page.click('button:has-text("' + testEmail + '")');

    // Click sign out
    await page.click('text=Sign Out');

    // Should be signed out
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should protect account page when not logged in', async ({ page }) => {
    await page.goto('/account');

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
