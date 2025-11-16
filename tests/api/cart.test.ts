import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiRequest } from '../helpers/api';
import { createTestProduct, createTestUser, deleteTestProduct, deleteTestUser, createTestSupabaseClient } from '../helpers/database';

describe('Cart API', () => {
  let testProduct: any;
  let testUser: any;
  let accessToken: string;

  beforeAll(async () => {
    // Create test product
    testProduct = await createTestProduct({
      name: 'Cart Test Product',
      price: 39.99,
      inventory_count: 10,
    });

    // Create test user and get auth token
    const { user, password } = await createTestUser();
    testUser = user;

    // Sign in to get access token
    const supabase = createTestSupabaseClient();
    const { data } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    accessToken = data.session!.access_token;
  });

  afterAll(async () => {
    // Cleanup
    if (testProduct) await deleteTestProduct(testProduct.id);
    if (testUser) await deleteTestUser(testUser.id);
  });

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      const { status, ok, data } = await apiRequest('/api/cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: 2,
        }),
      });

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(data).toHaveProperty('id');
      expect(data.product_id).toBe(testProduct.id);
      expect(data.quantity).toBe(2);
    });

    it('should reject invalid quantity', async () => {
      const { status } = await apiRequest('/api/cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: 0,
        }),
      });

      expect(status).toBe(400);
    });

    it('should reject quantity exceeding inventory', async () => {
      const { status, data } = await apiRequest('/api/cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: 1000,
        }),
      });

      expect(status).toBe(400);
      expect(data.error).toContain('available in stock');
    });

    it('should reject without authentication', async () => {
      const { status } = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: 1,
        }),
      });

      expect(status).toBe(401);
    });
  });

  describe('GET /api/cart', () => {
    it('should get user cart items', async () => {
      const { status, ok, data } = await apiRequest('/api/cart', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(status).toBe(200);
      expect(ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should require authentication', async () => {
      const { status } = await apiRequest('/api/cart');

      expect(status).toBe(401);
    });
  });
});
