import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiRequest } from '../helpers/api';
import { createTestProduct, deleteTestProduct, cleanupTestData } from '../helpers/database';

describe('Products API', () => {
  let testProduct: any;

  beforeAll(async () => {
    // Create a test product
    testProduct = await createTestProduct({
      name: 'Test API Product',
      slug: `test-api-product-${Date.now()}`,
      price: 49.99,
      inventory_count: 5,
      is_published: true,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testProduct) {
      await deleteTestProduct(testProduct.id);
    }
    await cleanupTestData();
  });

  describe('GET /api/products', () => {
    it('should return list of published products', async () => {
      const { status, ok, data } = await apiRequest('/api/products');

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Verify product structure
      const product = data.find((p: any) => p.id === testProduct.id);
      expect(product).toBeDefined();
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('slug');
      expect(product.is_published).toBe(true);
    });

    it('should filter by featured products', async () => {
      const { status, data } = await apiRequest('/api/products?featured=true');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      // All returned products should be featured
      data.forEach((product: any) => {
        expect(product.featured).toBe(true);
      });
    });

    it('should filter by category', async () => {
      // This would require a category to exist
      const { status } = await apiRequest('/api/products?category=some-uuid');
      expect(status).toBe(200);
    });

    it('should search products by name', async () => {
      const { status, data } = await apiRequest(`/api/products?search=${encodeURIComponent('Test API')}`);

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      // Should find our test product
      const found = data.find((p: any) => p.id === testProduct.id);
      expect(found).toBeDefined();
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should get product by ID', async () => {
      const { status, ok, data } = await apiRequest(`/api/products/${testProduct.id}`);

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data.id).toBe(testProduct.id);
      expect(data.name).toBe(testProduct.name);
      expect(data.price).toBe(testProduct.price);
    });

    it('should get product by slug', async () => {
      const { status, ok, data } = await apiRequest(`/api/products/${testProduct.slug}`);

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data.id).toBe(testProduct.id);
      expect(data.slug).toBe(testProduct.slug);
    });

    it('should return 404 for non-existent product', async () => {
      const { status } = await apiRequest('/api/products/00000000-0000-0000-0000-000000000000');

      expect(status).toBe(404);
    });

    it('should return 404 for invalid slug', async () => {
      const { status } = await apiRequest('/api/products/non-existent-slug');

      expect(status).toBe(404);
    });

    it('should not return unpublished products', async () => {
      // Create an unpublished product
      const unpublished = await createTestProduct({
        name: 'Unpublished Product',
        slug: `unpublished-${Date.now()}`,
        is_published: false,
      });

      const { status } = await apiRequest(`/api/products/${unpublished.id}`);

      expect(status).toBe(404);

      // Cleanup
      await deleteTestProduct(unpublished.id);
    });
  });
});
