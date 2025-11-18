# Supabase Database Setup

This directory contains SQL migrations for your Supabase database.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from the migration file
5. Click **Run** to execute

### Option 2: Using Supabase CLI (For Production)

```bash
# Initialize Supabase in your project (if not already done)
npx supabase init

# Link to your remote project
npx supabase link --project-ref YOUR_PROJECT_REF

# Pull existing migrations
npx supabase db pull

# Apply new migrations
npx supabase db push
```

## Current Migrations

### `20250118_reduce_inventory_function.sql`

Creates the `reduce_inventory` function that's called when orders are placed to decrement product inventory.

**What it does:**
- Reduces product inventory count by the specified quantity
- Only reduces inventory if sufficient stock exists
- Throws an error if insufficient inventory
- Updates the `updated_at` timestamp

**Required for:**
- Order processing via Stripe webhooks
- Inventory management when orders are placed
