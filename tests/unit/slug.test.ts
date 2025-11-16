import { describe, it, expect } from 'vitest';

/**
 * Test slug generation utility
 * This function is used in multiple places to generate URL-friendly slugs
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

describe('generateSlug', () => {
  it('should convert simple product name to slug', () => {
    expect(generateSlug('Handmade Beaded Bracelet')).toBe('handmade-beaded-bracelet');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Rose & Gold Necklace!')).toBe('rose-gold-necklace');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('Beautiful   Hand   Crafted')).toBe('beautiful-hand-crafted');
  });

  it('should handle numbers', () => {
    expect(generateSlug('Bracelet 2024 Edition')).toBe('bracelet-2024-edition');
  });

  it('should remove leading and trailing dashes', () => {
    expect(generateSlug('  Bracelet  ')).toBe('bracelet');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('should handle only special characters', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('');
  });

  it('should be idempotent', () => {
    const name = 'Handmade Bracelet';
    const slug = generateSlug(name);
    expect(generateSlug(slug)).toBe(slug);
  });
});
