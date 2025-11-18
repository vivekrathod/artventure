import { test, expect } from '@playwright/test';

test.describe('Cleanup Test Data', () => {
  test('should clean up all test data via API', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/admin/cleanup-test-data`, {
      headers: {
        'Authorization': 'Bearer cleanup-test-data-secret',
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('🧹 Cleanup Results:');
    console.log(`  Products deleted: ${data.results.products.deleted}`);
    console.log(`  Orders deleted: ${data.results.orders.deleted}`);
    console.log(`  Users deleted: ${data.results.users.deleted}`);
    console.log(`  Cart items deleted: ${data.results.cartItems.deleted}`);

    if (data.results.users.errors.length > 0) {
      console.log(`  User deletion errors: ${data.results.users.errors.length}`);
      data.results.users.errors.forEach((err: any) => {
        console.log(`    - ${err.email}: ${err.error}`);
      });
    }

    expect(data.success).toBe(true);
    expect(data.message).toBe('Test data cleanup completed');
  });
});
