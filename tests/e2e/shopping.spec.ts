import { test, expect } from '@playwright/test';
import { createAndSignInUser, cleanupUser } from '../helpers/e2e';

test.describe('Shopping Flow', () => {
  test('should browse products and view details', async ({ page }) => {
    await page.goto('/products');

    // Should show products
    await expect(page.locator('h1')).toContainText(/Products|Shop/i);

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('h2, h3').textContent();

    await firstProduct.click();

    // Should be on product detail page
    await expect(page).toHaveURL(/\/products\//);

    // Should show product details
    if (productName) {
      await expect(page.locator('h1')).toContainText(productName);
    }

    // Should have add to cart button
    await expect(page.locator('button:has-text("Add to Cart")')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Create and sign in user via admin API
    const { user } = await createAndSignInUser(page);

    await page.goto('/products');

    // Click on a product
    await page.locator('[data-testid="product-card"]').first().click();

    // Wait for product page to load
    await page.waitForLoadState('networkidle');

    // Add to cart
    await page.click('button:has-text("Add to Cart")');

    // Should show success message
    await expect(page.locator('text=/Added to cart|Success/i')).toBeVisible({
      timeout: 5000,
    });

    // Cart count should update
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('1');

    // Cleanup
    await cleanupUser(user.id);
  });

  test('should view and manage cart', async ({ page }) => {
    // Create and sign in user via admin API
    const { user } = await createAndSignInUser(page);

    // Add item to cart first
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Wait for success message to ensure item was added
    await expect(page.locator('text=/Added to cart|Success/i')).toBeVisible({ timeout: 5000 });
    
    // Wait a bit for localStorage to update
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto('/cart');

    // Should show cart items
    await expect(page.locator('h1')).toContainText(/Cart|Shopping Cart/i);

    // Should have at least one item
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1, { timeout: 5000 });

    // Should show quantity controls
    await expect(page.locator('button:has-text("+")')).toBeVisible();
    await expect(page.locator('button:has-text("-")')).toBeVisible();

    // Should show remove button
    await expect(page.locator('button:has-text("Remove")')).toBeVisible();

    // Should show checkout button
    await expect(page.locator('button:has-text("Checkout"), a:has-text("Checkout")')).toBeVisible();

    // Cleanup
    await cleanupUser(user.id);
  });

  test('should update cart quantity', async ({ page }) => {
    // Create and sign in user via admin API
    const { user } = await createAndSignInUser(page);

    // Add item to cart
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Wait for success message
    await expect(page.locator('text=/Added to cart|Success/i')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto('/cart');

    // Wait for cart to load
    await page.waitForLoadState('networkidle');

    // Get initial quantity
    const quantityDisplay = page.locator('[data-testid="item-quantity"]').first();
    const initialQuantity = await quantityDisplay.textContent();

    // Increase quantity
    await page.locator('button:has-text("+")').first().click();

    // Wait for update
    await page.waitForTimeout(500);

    // Quantity should increase
    const newQuantity = await quantityDisplay.textContent();
    expect(parseInt(newQuantity || '0')).toBeGreaterThan(parseInt(initialQuantity || '0'));

    // Cleanup
    await cleanupUser(user.id);
  });

  test('should remove item from cart', async ({ page }) => {
    // Create and sign in user via admin API
    const { user } = await createAndSignInUser(page);

    // Add item to cart
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Wait for success message
    await expect(page.locator('text=/Added to cart|Success/i')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto('/cart');

    // Remove item
    await page.click('button:has-text("Remove")');

    // Cart should be empty (use first() to handle multiple matches)
    await expect(page.locator('text=/empty/i').first()).toBeVisible({
      timeout: 5000,
    });

    // Cleanup
    await cleanupUser(user.id);
  });

  test('should proceed to checkout', async ({ page }) => {
    // Create and sign in user via admin API
    const { user } = await createAndSignInUser(page);

    // Add item to cart
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.click('button:has-text("Add to Cart")');
    
    // Wait for success message
    await expect(page.locator('text=/Added to cart|Success/i')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto('/cart');

    // Click checkout (it's a link, not a button)
    await page.click('a:has-text("Checkout"), button:has-text("Checkout")');

    // Should be on checkout page
    await expect(page).toHaveURL(/\/checkout/);

    // Should show order summary
    await expect(page.locator('text=/Order Summary|Checkout/i')).toBeVisible();

    // Should show payment button
    await expect(page.locator('button:has-text("Proceed to Payment"), button:has-text("Payment"), button:has-text("Pay")')).toBeVisible();

    // Cleanup
    await cleanupUser(user.id);
  });
});

test.describe('Search and Filter', () => {
  test('should search for products', async ({ page }) => {
    await page.goto('/products');

    // Find search input (if it exists)
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('bracelet');
      await page.keyboard.press('Enter');

      // Results should update
      await page.waitForLoadState('networkidle');

      // Should show results (or no results message)
      const hasResults = await page.locator('[data-testid="product-card"]').count();
      const hasNoResults = await page.locator('text=/No products|No results/i').isVisible();

      expect(hasResults > 0 || hasNoResults).toBe(true);
    }
  });
});
