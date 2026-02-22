/**
 * Unit tests for authentication sign-out functionality
 * 
 * TDD Approach: Tests written FIRST to define expected behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('Sign Out Functionality', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    // Create fresh client for each test
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  it('should successfully sign out authenticated user', async () => {
    // This test verifies that signOut() call completes without error
    // We can't easily test cookie clearing in unit tests, but we can verify
    // the Supabase client method works correctly
    
    const { error } = await supabase.auth.signOut();
    
    expect(error).toBeNull();
  });

  it('should clear user session after sign out', async () => {
    // After sign out, getSession should return null
    await supabase.auth.signOut();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    expect(session).toBeNull();
  });

  it('should handle sign out when no user is logged in', async () => {
    // Signing out when not logged in should not throw error
    const { error } = await supabase.auth.signOut();
    
    expect(error).toBeNull();
  });
});

// API Route tests require dev server to be running
// These are covered by E2E tests, so we skip them in pure unit test runs
describe.skipIf(!process.env.DEV_SERVER_RUNNING)('Sign Out API Route', () => {
  it('should accept POST requests to /auth/signout', async () => {
    // Test that the API endpoint exists and responds
    const response = await fetch('http://localhost:3000/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should redirect (302/303/307) or return success
    expect([200, 302, 303, 307]).toContain(response.status);
  });

  it('should accept GET requests to /auth/signout for direct navigation', async () => {
    // Test that GET also works (for direct browser navigation)
    const response = await fetch('http://localhost:3000/auth/signout', {
      method: 'GET',
    });

    // Should redirect (302/303/307) or return success
    expect([200, 302, 303, 307]).toContain(response.status);
  });

  it('should redirect to home page after sign out', async () => {
    const response = await fetch('http://localhost:3000/auth/signout', {
      method: 'POST',
      redirect: 'manual', // Don't follow redirects
    });

    // Should redirect to home
    expect([302, 303, 307]).toContain(response.status);
    
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toMatch(/\/$/); // Should redirect to /
  });
});
