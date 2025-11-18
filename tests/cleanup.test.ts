import { describe, it, expect } from 'vitest';
import { createTestSupabaseClient } from './helpers/database';

describe('Cleanup Test Data', () => {
  it('should clean up all test data from Supabase', async () => {
    const supabase = createTestSupabaseClient();

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

    if (ordersError && ordersError.code !== 'PGRST116') {
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

    // 4. Clean up cart items (orphaned)
    console.log('Cleaning up orphaned cart items...');

    // First get all cart items
    const { data: allCarts } = await supabase
      .from('cart_items')
      .select('id, user_id');

    // Then get all valid user_ids from profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id');

    const validUserIds = new Set(profiles?.map(p => p.user_id) || []);

    // Find orphaned cart items
    const orphanedCarts = allCarts?.filter(cart => !validUserIds.has(cart.user_id)) || [];

    if (orphanedCarts.length > 0) {
      const orphanedIds = orphanedCarts.map(c => c.id);
      const { error: cartsError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', orphanedIds);

      if (cartsError) {
        console.error('Error deleting cart items:', cartsError);
      } else {
        console.log(`✓ Deleted ${orphanedCarts.length} orphaned cart items`);
      }
    } else {
      console.log('✓ No orphaned cart items to delete');
    }

    console.log('\n✨ Cleanup complete!');
  }, 60000); // 60 second timeout
});
