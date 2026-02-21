import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Check if API is available
async function checkApiAvailability() {
  try {
    const response = await fetch('http://localhost:3000/api/products?featured=true');
    return response.ok;
  } catch {
    return false;
  }
}

const API_AVAILABLE = await checkApiAvailability();

if (!API_AVAILABLE) {
  console.warn('⚠️  API not available (is dev server running?), skipping API tests');
}
import { apiRequest } from '../helpers/api';
import { createTestProduct, deleteTestProduct, cleanupTestData } from '../helpers/database';

describe.skipIf(!API_AVAILABLE)('Checkout API', () => {
  let testProduct: any;
  let lowStockProduct: any;
  let supabaseAvailable = false;

  beforeAll(async () => {
    try {
      // Create test products
      testProduct = await createTestProduct({
        name: 'Checkout Test Product',
        price: 49.99,
        inventory_count: 10,
      });

      lowStockProduct = await createTestProduct({
        name: 'Low Stock Product',
        price: 29.99,
        inventory_count: 2,
      });
      supabaseAvailable = true;
    } catch (error: any) {
      if (error.message?.includes('fetch failed') || error.code === 'EAI_AGAIN') {
        console.warn('⚠️  Supabase not available, skipping Checkout API tests');
        supabaseAvailable = false;
      } else {
        throw error;
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testProduct) await deleteTestProduct(testProduct.id);
    if (lowStockProduct) await deleteTestProduct(lowStockProduct.id);
    await cleanupTestData();
  });

  describe.skipIf(!API_AVAILABLE)('POST /api/checkout', () => {
    it('should create checkout session with valid items', async () => {
      const { status, ok, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              name: testProduct.name,
              price: testProduct.price,
              quantity: 2,
              description: 'Test description',
            },
          ],
        }),
      });

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('shippingCost');
      expect(data).toHaveProperty('subtotal');
    });

    it('should calculate free shipping over threshold', async () => {
      const { status, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              name: testProduct.name,
              price: 60.00, // Over $50 threshold
              quantity: 1,
              description: 'Test',
            },
          ],
        }),
      });

      expect(status).toBe(200);
      expect(data.shippingCost).toBe(0);
    });

    it('should charge shipping under threshold', async () => {
      const { status, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              product_id: testProduct.id,
              name: testProduct.name,
              price: 29.99,
              quantity: 1,
              description: 'Test',
            },
          ],
        }),
      });

      expect(status).toBe(200);
      expect(data.shippingCost).toBe(5.99);
    });

    it('should reject empty cart', async () => {
      const { status, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [],
        }),
      });

      expect(status).toBe(400);
      expect(data.error).toContain('No items');
    });

    it('should reject insufficient inventory', async () => {
      const { status, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              product_id: lowStockProduct.id,
              name: lowStockProduct.name,
              price: lowStockProduct.price,
              quantity: 10, // More than available
              description: 'Test',
            },
          ],
        }),
      });

      expect(status).toBe(400);
      expect(data.error).toContain('Insufficient inventory');
      expect(data.error).toContain('2 available');
    });

    it('should reject item without product_id', async () => {
      const { status, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              name: 'Test',
              price: 29.99,
              quantity: 1,
              description: 'Test',
            },
          ],
        }),
      });

      expect(status).toBe(400);
      expect(data.error).toContain('missing product ID');
    });

    it('should reject unpublished product', async () => {
      const unpublished = await createTestProduct({
        name: 'Unpublished',
        is_published: false,
      });

      const { status, data } = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              product_id: unpublished.id,
              name: 'Unpublished',
              price: 29.99,
              quantity: 1,
              description: 'Test',
            },
          ],
        }),
      });

      expect(status).toBe(400);
      expect(data.error).toContain('no longer available');

      await deleteTestProduct(unpublished.id);
    });
  });
});
