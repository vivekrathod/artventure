import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/store/cart';

describe('Cart Store', () => {
  beforeEach(() => {
    // Clear the cart before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('should start with empty cart', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.items).toEqual([]);
    expect(result.current.getTotalItems()).toBe(0);
    expect(result.current.getTotalPrice()).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      id: '1',
      name: 'Test Bracelet',
      slug: 'test-bracelet',
      price: 29.99,
      description: 'Test description',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    act(() => {
      result.current.addItem(mockProduct, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.getTotalItems()).toBe(2);
    expect(result.current.getTotalPrice()).toBe(59.98);
  });

  it('should update quantity when adding existing item', () => {
    const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      id: '1',
      name: 'Test Bracelet',
      slug: 'test-bracelet',
      price: 29.99,
      description: 'Test',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    act(() => {
      result.current.addItem(mockProduct, 1);
      result.current.addItem(mockProduct, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.getTotalItems()).toBe(3);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      id: '1',
      name: 'Test Bracelet',
      slug: 'test-bracelet',
      price: 29.99,
      description: 'Test',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.removeItem('1');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.getTotalItems()).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      id: '1',
      name: 'Test Bracelet',
      slug: 'test-bracelet',
      price: 29.99,
      description: 'Test',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.updateQuantity('1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.getTotalPrice()).toBe(149.95);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      id: '1',
      name: 'Test Bracelet',
      slug: 'test-bracelet',
      price: 29.99,
      description: 'Test',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should calculate total price correctly with multiple items', () => {
    const { result } = renderHook(() => useCartStore());

    const product1 = {
      id: '1',
      name: 'Bracelet',
      slug: 'bracelet',
      price: 29.99,
      description: 'Test',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    const product2 = {
      id: '2',
      name: 'Necklace',
      slug: 'necklace',
      price: 49.99,
      description: 'Test',
      inventory_count: 10,
      is_published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_images: [],
    };

    act(() => {
      result.current.addItem(product1, 2); // 59.98
      result.current.addItem(product2, 1); // 49.99
    });

    expect(result.current.getTotalPrice()).toBe(109.97);
  });
});
