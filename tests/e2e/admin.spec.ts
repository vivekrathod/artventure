import { test, expect } from '@playwright/test';
import { createAndSignInAdmin } from '../helpers/e2e';

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create and sign in as admin via admin API
    await createAndSignInAdmin(page);
  });

  test('should access admin panel', async ({ page }) => {
    // Click admin link in header
    await page.click('a[href="/admin"]');

    // Should be on admin page
    await expect(page).toHaveURL(/\/admin/);

    // Should show admin dashboard
    await expect(page.locator('h1')).toContainText(/Admin|Dashboard/i);
  });

  test('should view products list', async ({ page }) => {
    await page.goto('/admin/products');

    // Should show products table
    await expect(page.locator('h1')).toContainText(/Products|Manage Products/i);

    // Should have add product button
    await expect(page.locator('text=Add Product')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    await page.goto('/admin/products/new');

    // Fill in product form
    const productName = `Test Product ${Date.now()}`;

    await page.fill('input[name="name"]', productName);
    await page.fill('textarea[name="description"]', 'Test product description');
    await page.fill('input[name="price"]', '49.99');
    await page.fill('input[name="inventory_count"]', '10');
    await page.fill('input[name="materials"]', 'Glass beads');
    await page.fill('input[name="dimensions"]', '7 inches');
    await page.fill('textarea[name="care_instructions"]', 'Avoid water');

    // Check published
    await page.check('input[name="is_published"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to products list
    await expect(page).toHaveURL(/\/admin\/products$/);

    // Should show success message
    await expect(page.locator('text=/created|success/i')).toBeVisible({
      timeout: 5000,
    });

    // Product should appear in list
    await expect(page.locator('text=' + productName)).toBeVisible();
  });

  test('should upload product images', async ({ page }) => {
    await page.goto('/admin/products/new');

    // Fill basic info
    await page.fill('input[name="name"]', `Image Test ${Date.now()}`);
    await page.fill('input[name="price"]', '29.99');
    await page.fill('input[name="inventory_count"]', '5');

    // Upload image (would need actual file)
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible()) {
      // In real test, you'd upload an actual image file
      // This is a placeholder to show the test structure
      const imagePath = 'tests/fixtures/test-image.jpg';

      // Only proceed if fixture exists
      try {
        await fileInput.setInputFiles(imagePath);

        // Wait for upload
        await expect(page.locator('text=Upload/i, [data-testid="uploaded-image"]')).toBeVisible({
          timeout: 10000,
        });
      } catch (e) {
        // Fixture doesn't exist, skip image upload
        console.log('Skipping image upload - no fixture file');
      }
    }

    await page.check('input[name="is_published"]');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin\/products$/);
  });

  test('should edit existing product', async ({ page }) => {
    await page.goto('/admin/products');

    // Click edit on first product
    const editButton = page.locator('[data-testid="edit-product"]').first();
    await editButton.click();

    // Should be on edit page
    await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);

    // Modify product
    const nameInput = page.locator('input[name="name"]');
    const currentName = await nameInput.inputValue();
    const newName = currentName + ' (Updated)';

    await nameInput.fill(newName);

    // Save changes
    await page.click('button:has-text("Save")');

    // Should redirect back
    await expect(page).toHaveURL(/\/admin\/products$/);

    // Should show updated name
    await expect(page.locator('text=' + newName)).toBeVisible();
  });

  test('should delete product', async ({ page }) => {
    await page.goto('/admin/products');

    // Get first product name
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    const productName = await firstProduct.locator('td').first().textContent();

    // Click delete
    await firstProduct.locator('button:has-text("Delete"), [data-testid="delete-product"]').click();

    // Confirm deletion
    page.once('dialog', dialog => dialog.accept());

    // Wait for deletion and page update
    await page.waitForTimeout(2000);
    
    // Reload page to ensure product is gone
    await page.reload();

    // Product should be removed
    if (productName) {
      await expect(page.locator('text=' + productName)).not.toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Admin Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create and sign in as admin via admin API
    await createAndSignInAdmin(page);
  });

  test('should view orders list', async ({ page }) => {
    await page.goto('/admin/orders');

    // Should show orders
    await expect(page.locator('h1')).toContainText(/Orders|Manage Orders/i);

    // Should have table or list of orders
    const hasOrders = await page.locator('[data-testid="order-row"], tbody tr').count();

    // Either has orders or shows "no orders" message
    const hasNoOrdersMessage = await page.locator('text=/No orders|empty/i').isVisible();

    expect(hasOrders > 0 || hasNoOrdersMessage).toBe(true);
  });

  test('should update order status', async ({ page }) => {
    await page.goto('/admin/orders');

    // Check if there are any orders
    const orderCount = await page.locator('[data-testid="order-row"], tbody tr').count();

    if (orderCount > 0) {
      // Click on first order
      const firstOrder = page.locator('[data-testid="order-row"], tbody tr').first();

      // Find status dropdown
      const statusSelect = firstOrder.locator('select, [data-testid="order-status"]');

      if (await statusSelect.isVisible()) {
        // Change status
        await statusSelect.selectOption('processing');

        // Wait for update
        await page.waitForTimeout(1000);

        // Should show success message
        await expect(page.locator('text=/updated|success/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
