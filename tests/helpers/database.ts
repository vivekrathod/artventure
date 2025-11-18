import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for testing
 * Uses service role key for admin operations
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for testing');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a test product
 */
export async function createTestProduct(overrides: any = {}) {
  const supabase = createTestSupabaseClient();

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  const productData = {
    name: `Test Product ${timestamp}`,
    slug: `test-product-${timestamp}-${random}`,
    description: 'Test product description',
    price: 29.99,
    inventory_count: 10,
    is_published: true,
    featured: false,
    ...overrides,
  };

  // If name is overridden but slug is not, generate slug from name
  if (overrides.name && !overrides.slug) {
    productData.slug = `${overrides.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}-${random}`;
  }

  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a test user
 * Uses admin API to bypass email validation
 */
export async function createTestUser(email?: string) {
  const supabase = createTestSupabaseClient();

  // Use more unique email format with random string to avoid rate limits
  const randomId = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  const testEmail = email || `testuser${timestamp}${randomId}@test.local`;
  const password = 'TestPassword123!';

  // Retry logic for rate limits
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        },
      });

      if (error) {
        lastError = error;
        // If rate limited, wait and retry
        if (error.message?.includes('rate') || error.message?.includes('too many')) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        throw error;
      }

      return { user: data.user, password };
    } catch (err) {
      lastError = err;
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error('Failed to create test user after retries');
}

/**
 * Create an admin user
 */
export async function createTestAdmin() {
  const { user, password } = await createTestUser();
  const supabase = createTestSupabaseClient();

  // Set user as admin
  await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('user_id', user.id);

  return { user, password };
}

/**
 * Delete a test product
 */
export async function deleteTestProduct(productId: string) {
  const supabase = createTestSupabaseClient();

  await supabase
    .from('products')
    .delete()
    .eq('id', productId);
}

/**
 * Delete a test user
 */
export async function deleteTestUser(userId: string) {
  const supabase = createTestSupabaseClient();

  await supabase.auth.admin.deleteUser(userId);
}

/**
 * Clean up all test data
 * Gracefully handles network errors (common in CI environments)
 */
export async function cleanupTestData() {
  try {
    const supabase = createTestSupabaseClient();

    // Delete test products (with 'test-product' in slug)
    try {
      await supabase
        .from('products')
        .delete()
        .like('slug', 'test-product%');
    } catch (error: any) {
      // Ignore network errors
      if (!error.message?.includes('fetch failed')) {
        console.warn('Error cleaning test products:', error.message);
      }
    }

    // Delete test users (with 'test-' in email)
    try {
      const { data: users } = await supabase.auth.admin.listUsers();

      if (users?.users) {
        for (const user of users.users) {
          if (user.email?.startsWith('test-')) {
            await supabase.auth.admin.deleteUser(user.id);
          }
        }
      }
    } catch (error: any) {
      // Ignore network errors
      if (!error.message?.includes('fetch failed')) {
        console.warn('Error cleaning test users:', error.message);
      }
    }
  } catch (error: any) {
    // Silently ignore network connectivity issues
    if (!error.message?.includes('fetch failed') && error.code !== 'EAI_AGAIN') {
      console.warn('Error during test cleanup:', error.message);
    }
  }
}
