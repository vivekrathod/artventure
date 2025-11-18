#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test data...\n');

  // 1. Delete test products
  console.log('Deleting test products...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .delete()
    .or('slug.like.test-product%,slug.like.%test%,name.like.Test Product%')
    .select('id');

  if (productsError) {
    console.error('Error deleting products:', productsError);
  } else {
    console.log(`✓ Deleted ${products?.length || 0} test products`);
  }

  // 2. Delete test orders (if any)
  console.log('Deleting test orders...');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .delete()
    .eq('status', 'pending')
    .select('id');

  if (ordersError && ordersError.code !== 'PGRST116') { // Ignore "no rows found" error
    console.error('Error deleting orders:', ordersError);
  } else {
    console.log(`✓ Deleted ${orders?.length || 0} pending orders`);
  }

  // 3. Delete test users
  console.log('Deleting test users...');
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
  } else if (usersData?.users) {
    const testUsers = usersData.users.filter(
      user => user.email?.includes('@test.local') ||
              user.email?.startsWith('test-') ||
              user.email?.startsWith('testuser')
    );

    console.log(`Found ${testUsers.length} test users to delete...`);

    let deletedCount = 0;
    for (const user of testUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`  ✗ Failed to delete ${user.email}:`, deleteError.message);
        } else {
          deletedCount++;
          console.log(`  ✓ Deleted ${user.email}`);
        }
      } catch (err) {
        console.error(`  ✗ Error deleting ${user.email}:`, err);
      }
    }

    console.log(`✓ Deleted ${deletedCount} test users`);
  }

  // 4. Clean up cart items (orphaned or test-related)
  console.log('Cleaning up cart items...');
  const { data: carts, error: cartsError } = await supabase
    .from('cart_items')
    .delete()
    .not('user_id', 'in', `(SELECT user_id FROM profiles)`)
    .select('id');

  if (cartsError && cartsError.code !== 'PGRST116') {
    console.error('Error deleting cart items:', cartsError);
  } else {
    console.log(`✓ Deleted ${carts?.length || 0} orphaned cart items`);
  }

  console.log('\n✨ Cleanup complete!');
}

cleanupTestData().catch(console.error);
