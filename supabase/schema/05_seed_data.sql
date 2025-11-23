-- ============================================================================
-- SEED DATA (OPTIONAL)
-- Description: Initial data for development and testing
-- ============================================================================

-- ============================================================================
-- CATEGORIES
-- ============================================================================
INSERT INTO categories (name, slug, description) VALUES
  ('Necklaces', 'necklaces', 'Beautiful handmade beaded necklaces'),
  ('Bracelets', 'bracelets', 'Elegant beaded bracelets for any occasion'),
  ('Earrings', 'earrings', 'Stunning beaded earrings'),
  ('Rings', 'rings', 'Unique beaded rings')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ADMIN USER SETUP
-- ============================================================================
-- After creating your first user account via the signup form,
-- run this SQL to make that user an admin:
--
-- UPDATE profiles
-- SET is_admin = true
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
--
-- Or use the SQL Editor in Supabase Dashboard
