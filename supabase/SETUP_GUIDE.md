# Supabase Setup Guide - ArtVenture E-Commerce

Complete guide to setting up the Supabase database for ArtVenture from scratch.

## Prerequisites

- Supabase account (free tier is sufficient)
- New Supabase project created
- Access to Supabase Dashboard

## Quick Setup (Recommended)

### Option 1: Single File Import

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"+ New query"**
4. Copy the entire contents of `schema/00_complete_schema.sql`
5. Paste into the SQL editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for completion (should take 2-3 seconds)
8. Verify: You should see "Success. No rows returned"

### Option 2: Step-by-Step Import

Run these files in order in the SQL Editor:

1. `schema/01_tables.sql` - Create all tables
2. `schema/02_indexes.sql` - Add performance indexes
3. `schema/03_functions.sql` - Create functions and triggers
4. `schema/04_rls_policies.sql` - Enable Row Level Security
5. `schema/05_seed_data.sql` - (Optional) Add sample categories

## Post-Setup Configuration

### 1. Create Storage Bucket for Product Images

1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Name: `product-images`
4. Public bucket: ✅ **Enabled**
5. File size limit: 5MB (or adjust as needed)
6. Allowed MIME types: `image/png, image/jpeg, image/webp`
7. Click **"Create bucket"**

### 2. Make First Admin User

After you create your first user account via the app's signup form:

1. Go to **SQL Editor**
2. Run this query (replace with your email):

```sql
UPDATE profiles
SET is_admin = true
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

3. Verify:

```sql
SELECT u.email, p.is_admin
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable desired providers:
   - ✅ Email (enabled by default)
   - ✅ Google (optional)
   - ✅ GitHub (optional)

3. Set redirect URLs:
   - Development: `http://localhost:3000/**`
   - Production: `https://www.sukusartventure.com/**`

4. Go to **Authentication** → **URL Configuration**
   - Site URL: `https://www.sukusartventure.com`
   - Redirect URLs: Add both development and production URLs

### 4. Get Environment Variables

1. Go to **Project Settings** → **API**
2. Copy these values to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Keep this secret!
```

## Verification

Run these queries in SQL Editor to verify everything is set up:

```sql
-- 1. Check all tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables:
- cart_items
- categories
- order_items
- orders
- product_images
- products
- profiles
- shipping_addresses

```sql
-- 2. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

Expected: **No rows** (all tables should have RLS enabled)

```sql
-- 3. Check all policies exist
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```

Expected: **27 policies**

```sql
-- 4. Verify functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Expected functions:
- handle_new_user
- is_admin_user
- reduce_inventory
- update_updated_at_column

```sql
-- 5. Check seed data loaded
SELECT COUNT(*) as category_count FROM categories;
```

Expected: **4 categories** (if you ran seed data)

## Database Migrations

For future schema changes, add migration files to `supabase/migrations/`:

```
supabase/migrations/
  YYYYMMDD_migration_name.sql
```

Example:
```
20250118_reduce_inventory_function.sql
```

### Applying Migrations

**Via Supabase Dashboard:**
1. Open SQL Editor
2. Copy migration file contents
3. Paste and run

**Via Supabase CLI** (if installed):
```bash
supabase db push
```

## Backup and Restore

### Backup Your Database

1. Go to **Database** → **Backups**
2. Click **"Backup now"**
3. Or set up automated daily backups (free tier: 7 days retention)

### Manual SQL Backup

```bash
# Export schema and data
supabase db dump -f backup.sql

# Or via pg_dump if you have direct connection
pg_dump -h db.your-project.supabase.co -U postgres artventure > backup.sql
```

### Restore from Backup

```bash
# Via Supabase CLI
supabase db reset

# Then re-run schema files
```

## Troubleshooting

### Issue: Tables created but no data visible

**Cause:** RLS policies blocking access

**Solution:** Verify you're authenticated and policies are correct:
```sql
-- Check if current user is authenticated
SELECT auth.uid();

-- Should return a UUID if logged in, NULL if not
```

### Issue: "permission denied for table X"

**Cause:** Missing RLS policies or incorrect policy logic

**Solution:** Check policy for that table:
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

### Issue: Function "reduce_inventory" not found

**Cause:** Function wasn't created or wrong schema

**Solution:** Re-run `03_functions.sql` or check:
```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name = 'reduce_inventory';
```

### Issue: New users not getting profiles automatically

**Cause:** Trigger not created or not firing

**Solution:** Check trigger exists:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If missing, re-run the trigger creation from `03_functions.sql`.

## Production Checklist

Before going live:

- [ ] All schema files executed successfully
- [ ] Storage bucket created and public
- [ ] At least one admin user created
- [ ] Environment variables set in production (Vercel)
- [ ] Authentication URLs configured for production domain
- [ ] Automated backups enabled
- [ ] Connection pooling enabled (if using Prisma or high traffic)
- [ ] Database statistics optimized (run ANALYZE)

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Project Documentation**: See `/claude.md` for architecture details

## Version History

- **v1.0** (2025-01-18): Initial schema with all tables, RLS, triggers, and seed data
