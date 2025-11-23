-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Description: Security policies for all tables
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid() OR is_admin_user());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    is_admin = (SELECT is_admin FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (is_admin_user());

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view published products" ON products;
CREATE POLICY "Anyone can view published products" ON products
  FOR SELECT USING (is_published = true OR is_admin_user());

DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (is_admin_user());

-- ============================================================================
-- PRODUCT IMAGES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
CREATE POLICY "Anyone can view product images" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
      AND (products.is_published = true OR is_admin_user())
    )
  );

DROP POLICY IF EXISTS "Admins can insert product images" ON product_images;
CREATE POLICY "Admins can insert product images" ON product_images
  FOR INSERT WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can update product images" ON product_images;
CREATE POLICY "Admins can update product images" ON product_images
  FOR UPDATE USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can delete product images" ON product_images;
CREATE POLICY "Admins can delete product images" ON product_images
  FOR DELETE USING (is_admin_user());

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    is_admin_user()
  );

DROP POLICY IF EXISTS "Service role can create orders" ON orders;
CREATE POLICY "Service role can create orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (is_admin_user());

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        is_admin_user()
      )
    )
  );

DROP POLICY IF EXISTS "Service role can create order items" ON order_items;
CREATE POLICY "Service role can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- CART ITEMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert to own cart" ON cart_items;
CREATE POLICY "Users can insert to own cart" ON cart_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete from own cart" ON cart_items;
CREATE POLICY "Users can delete from own cart" ON cart_items
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- SHIPPING ADDRESSES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own addresses" ON shipping_addresses;
CREATE POLICY "Users can view own addresses" ON shipping_addresses
  FOR SELECT USING (user_id = auth.uid() OR is_admin_user());

DROP POLICY IF EXISTS "Users can create own addresses" ON shipping_addresses;
CREATE POLICY "Users can create own addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own addresses" ON shipping_addresses;
CREATE POLICY "Users can update own addresses" ON shipping_addresses
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own addresses" ON shipping_addresses;
CREATE POLICY "Users can delete own addresses" ON shipping_addresses
  FOR DELETE USING (user_id = auth.uid());
