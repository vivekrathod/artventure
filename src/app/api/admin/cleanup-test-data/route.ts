import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Check for admin auth token (simple protection)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_AUTH_TOKEN || 'cleanup-test-data-secret';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: any = {
      products: { deleted: 0, error: null },
      orders: { deleted: 0, error: null },
      users: { deleted: 0, errors: [] },
      cartItems: { deleted: 0, error: null },
    };

    // 1. Delete test products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .delete()
      .or('slug.like.test-product%,slug.like.%test%,name.like.Test Product%')
      .select('id');

    if (productsError) {
      results.products.error = productsError.message;
    } else {
      results.products.deleted = products?.length || 0;
    }

    // 2. Delete test orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('status', 'pending')
      .select('id');

    if (ordersError && ordersError.code !== 'PGRST116') {
      results.orders.error = ordersError.message;
    } else {
      results.orders.deleted = orders?.length || 0;
    }

    // 3. Delete test users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      results.users.error = listError.message;
    } else if (usersData?.users) {
      const testUsers = usersData.users.filter(
        user => user.email?.includes('@test.local') ||
                user.email?.startsWith('test-') ||
                user.email?.startsWith('testuser')
      );

      for (const user of testUsers) {
        try {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          if (deleteError) {
            results.users.errors.push({ email: user.email, error: deleteError.message });
          } else {
            results.users.deleted++;
          }
        } catch (err: any) {
          results.users.errors.push({ email: user.email, error: err.message });
        }
      }
    }

    // 4. Clean up orphaned cart items
    const { data: allCarts } = await supabase
      .from('cart_items')
      .select('id, user_id');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id');

    const validUserIds = new Set(profiles?.map((p: any) => p.user_id) || []);
    const orphanedCarts = allCarts?.filter((cart: any) => !validUserIds.has(cart.user_id)) || [];

    if (orphanedCarts.length > 0) {
      const orphanedIds = orphanedCarts.map((c: any) => c.id);
      const { error: cartsError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', orphanedIds);

      if (cartsError) {
        results.cartItems.error = cartsError.message;
      } else {
        results.cartItems.deleted = orphanedCarts.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test data cleanup completed',
      results,
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
