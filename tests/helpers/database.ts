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

  const productData = {
    name: `Test Product ${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    description: 'Test product description',
    price: 29.99,
    inventory_count: 10,
    is_published: true,
    featured: false,
    ...overrides,
  };

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
 */
export async function createTestUser(email?: string) {
  const supabase = createTestSupabaseClient();

  const testEmail = email || `test-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User',
    },
  });

  if (error) throw error;
  return { user: data.user, password };
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
 */
export async function cleanupTestData() {
  const supabase = createTestSupabaseClient();

  // Delete test products (with 'test-product' in slug)
  await supabase
    .from('products')
    .delete()
    .like('slug', 'test-product%');

  // Delete test users (with 'test-' in email)
  const { data: users } = await supabase.auth.admin.listUsers();

  if (users?.users) {
    for (const user of users.users) {
      if (user.email?.startsWith('test-')) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  }
}
