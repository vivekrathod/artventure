# Supabase Database Documentation

Complete database setup and migration files for the ArtVenture e-commerce platform.

## Directory Structure

```
supabase/
├── README.md                          # This file
├── SETUP_GUIDE.md                     # Complete setup instructions
├── schema/                            # Organized schema files
│   ├── 00_complete_schema.sql         # Single-file complete schema (RECOMMENDED)
│   ├── 01_tables.sql                  # Table definitions
│   ├── 02_indexes.sql                 # Performance indexes
│   ├── 03_functions.sql               # Functions and triggers
│   ├── 04_rls_policies.sql            # Row Level Security policies
│   └── 05_seed_data.sql               # Optional seed data
├── migrations/                        # Database migrations (timestamped)
│   └── 20250118_reduce_inventory_function.sql
└── supabase-schema.sql                # Legacy complete schema (kept for reference)
```

## Quick Start

### New Supabase Project Setup

For a brand new Supabase project, use the complete schema file:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `schema/00_complete_schema.sql`
3. Paste and run
4. Done! All tables, indexes, functions, RLS policies created

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.**

### Existing Project - Apply Migrations Only

If you already have the schema and need to apply new changes:

```sql
-- Run migration files in order
-- Example: Adding new function
\i migrations/20250118_reduce_inventory_function.sql
```

## Database Schema Overview

### Tables (8 total)

- **profiles** - User metadata and admin flags
- **categories** - Product categories
- **products** - Product catalog with inventory
- **product_images** - Product photo gallery
- **orders** - Customer orders
- **order_items** - Line items in orders
- **cart_items** - Shopping cart (server-side)
- **shipping_addresses** - Saved addresses

### Functions (4 total)

- **is_admin_user()** - Check if current user is admin
- **reduce_inventory(product_id, quantity)** - Atomic inventory reduction
- **handle_new_user()** - Auto-create profile on signup
- **update_updated_at_column()** - Update timestamp trigger

### Triggers (5 total)

- **on_auth_user_created** - Auto-create profile
- **update_profiles_updated_at** - Update timestamp on profile changes
- **update_products_updated_at** - Update timestamp on product changes
- **update_orders_updated_at** - Update timestamp on order changes
- **update_cart_items_updated_at** - Update timestamp on cart changes

### RLS Policies (27 total)

All tables have Row Level Security enabled with appropriate policies for:
- Public read access (categories, published products)
- User-owned data access (profiles, cart, orders)
- Admin-only access (product management, order updates)

## Common Operations

### Make User Admin

```sql
UPDATE profiles
SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Check Database Health

```sql
-- Verify all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Count policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

### Reset Database (Development Only!)

```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run schema/00_complete_schema.sql
```

## Migrations

Add new migration files to `migrations/` directory with format:

```
YYYYMMDD_description.sql
```

Example:
```
20250118_reduce_inventory_function.sql
20250119_add_product_reviews.sql
```

## Storage Buckets

The following storage buckets need to be created manually:

- **product-images** (public) - For product photos

See SETUP_GUIDE.md for detailed bucket configuration.

## Environment Variables

Required for application:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Notes

1. **RLS is enabled** on all tables - no direct access without proper authentication
2. **Service role key** bypasses RLS - keep it secret, only use server-side
3. **Anon key** is safe to expose client-side - it respects RLS
4. **Admin users** are controlled via `is_admin` flag in profiles table

## Backup Strategy

### Automated Backups (Supabase)
- Free tier: 7 days retention
- Pro tier: 30 days retention
- Enable in Dashboard → Database → Backups

### Manual Backups

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Via pg_dump (if you have connection details)
pg_dump -h db.xxx.supabase.co -U postgres dbname > backup.sql
```

## Troubleshooting

### Common Issues

1. **"relation does not exist"** - Table not created, run schema files
2. **"permission denied"** - RLS blocking access, check policies
3. **"duplicate key value"** - Unique constraint violated, check data
4. **"function does not exist"** - Run `03_functions.sql`

### Debug Queries

```sql
-- Check current user
SELECT auth.uid(), auth.email();

-- Check if user is admin
SELECT is_admin_user();

-- View all policies for a table
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Check trigger exists
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

## Documentation

- **Architecture**: See `/claude.md` for complete application architecture
- **Setup Guide**: See `SETUP_GUIDE.md` for step-by-step setup
- **API Docs**: See `/claude.md` for API endpoint documentation

## Version

Current schema version: **1.0** (2025-01-18)

## Support

- Supabase Docs: https://supabase.com/docs
- Project Docs: `/claude.md`
- GitHub Issues: [Report issues](https://github.com/vivekrathod/artventure/issues)
