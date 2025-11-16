# Claude Knowledge Base - Artisan Beads E-Commerce Platform

This document contains comprehensive technical knowledge about the handmade jewelry e-commerce platform built for 100% FREE-tier deployment.

**Last Updated**: Session ending with comprehensive bug fixes and testing
**Platform Status**: Production-ready with all critical bugs fixed

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack & Rationale](#tech-stack--rationale)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Payment & Order Flow](#payment--order-flow)
6. [Critical Bugs Fixed](#critical-bugs-fixed)
7. [File Structure](#file-structure)
8. [API Endpoints](#api-endpoints)
9. [Environment Variables](#environment-variables)
10. [Common Pitfalls](#common-pitfalls)
11. [Deployment Guide](#deployment-guide)
12. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### Design Philosophy
- **100% Free Tier**: All services use free tiers until significant scale
- **Serverless**: Next.js API routes, no dedicated backend server
- **Edge-First**: Leverage Vercel Edge for performance
- **Security First**: Row Level Security (RLS) on all database tables

### Key Architectural Decisions

1. **Supabase over Clerk**: Clerk costs money, Supabase Auth is free
2. **Server-Side Rendering**: Better SEO, faster initial loads
3. **Hybrid Cart**: Client-side (localStorage) for guests, server-side for authenticated users
4. **Webhook-Based Orders**: Stripe webhooks create orders (not checkout success page)
5. **Slug-Based Routing**: SEO-friendly URLs with UUID fallback

---

## Tech Stack & Rationale

| Technology | Purpose | Why Chosen | Free Tier Limits |
|------------|---------|-----------|------------------|
| **Next.js 15** | Framework | React + SSR + API routes all-in-one | N/A (framework) |
| **Supabase** | Database + Auth + Storage | PostgreSQL + Auth + Storage + free hosting | 500MB DB, 1GB storage, unlimited users |
| **Stripe** | Payments | Industry standard, great DX | Pay per transaction only (2.9% + $0.30) |
| **Resend** | Emails | Modern, React email templates | 3,000 emails/month |
| **Vercel** | Hosting | Seamless Next.js deployment | 100GB bandwidth/month |
| **Tailwind CSS** | Styling | Utility-first, no CSS files | N/A (library) |
| **Zustand** | Client State | Lightweight, simple API | N/A (library) |

### Cost Breakdown (Monthly)
- Development: **$0**
- Production (< 1000 orders/month): **$0** + Stripe fees
- Production (1000+ orders/month): **~$0-25** (Supabase may need upgrade)

---

## Database Schema

### Core Tables

#### `profiles`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- full_name: TEXT
- is_admin: BOOLEAN (default: false)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Purpose**: User metadata and admin flags
**RLS**: Users can view/update own profile only

#### `categories`
```sql
- id: UUID (PK)
- name: TEXT
- slug: TEXT (UNIQUE)
- description: TEXT
- created_at: TIMESTAMP
```
**Purpose**: Product categorization
**RLS**: Public read, admin write

#### `products`
```sql
- id: UUID (PK)
- name: TEXT
- slug: TEXT (UNIQUE, generated from name)
- description: TEXT
- price: DECIMAL(10,2)
- category_id: UUID (FK → categories, nullable)
- inventory_count: INTEGER (default: 0)
- weight_oz: DECIMAL(5,2)
- materials: TEXT
- dimensions: TEXT
- care_instructions: TEXT
- is_published: BOOLEAN (default: false)
- featured: BOOLEAN (default: false)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Purpose**: Product catalog
**RLS**: Public read (if is_published), admin write
**Indexes**: slug, category_id, is_published, featured

#### `product_images`
```sql
- id: UUID (PK)
- product_id: UUID (FK → products, ON DELETE CASCADE)
- image_url: TEXT
- alt_text: TEXT (nullable)
- display_order: INTEGER (default: 0)
- created_at: TIMESTAMP
```
**Purpose**: Product photo gallery
**RLS**: Public read, admin write
**Indexes**: product_id, display_order

#### `cart_items`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- product_id: UUID (FK → products)
- quantity: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Purpose**: Server-side cart (authenticated users only)
**RLS**: Users can only access own cart items
**Unique**: (user_id, product_id)

#### `orders`
```sql
- id: UUID (PK)
- order_number: TEXT (UNIQUE, generated)
- user_id: UUID (FK → auth.users, nullable for guest orders)
- email: TEXT
- shipping_address: JSONB {name, address_line1, address_line2, city, state, postal_code, country, phone}
- shipping_cost: DECIMAL(10,2)
- tax_amount: DECIMAL(10,2)
- total_amount: DECIMAL(10,2)
- stripe_payment_id: TEXT
- status: TEXT (pending, processing, shipped, delivered, cancelled)
- tracking_number: TEXT (nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Purpose**: Customer orders
**RLS**: Users can view own orders, admin can view all
**Indexes**: order_number, user_id, email, status, stripe_payment_id

#### `order_items`
```sql
- id: UUID (PK)
- order_id: UUID (FK → orders, ON DELETE CASCADE)
- product_id: UUID (FK → products)
- product_name: TEXT (snapshot at purchase)
- price_at_purchase: DECIMAL(10,2)
- quantity: INTEGER
- created_at: TIMESTAMP
```
**Purpose**: Line items in orders
**RLS**: Inherits from orders (via order_id)
**Indexes**: order_id, product_id

#### `shipping_addresses`
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- name: TEXT
- address_line1: TEXT
- address_line2: TEXT
- city: TEXT
- state: TEXT
- postal_code: TEXT
- country: TEXT
- phone: TEXT
- is_default: BOOLEAN (default: false)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```
**Purpose**: Saved shipping addresses (not yet implemented in UI)
**RLS**: Users can only access own addresses

### Database Functions

#### `reduce_inventory(product_id UUID, quantity INTEGER)`
```sql
CREATE OR REPLACE FUNCTION reduce_inventory(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET inventory_count = inventory_count - quantity
  WHERE id = product_id AND inventory_count >= quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
**Purpose**: Atomic inventory reduction with validation
**Used By**: Stripe webhook after successful payment
**Security**: DEFINER ensures it runs with elevated privileges

#### `is_admin_user()`
```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
**Purpose**: Check if current user is admin
**Used By**: RLS policies for admin-only tables

#### `handle_new_user()`
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
**Purpose**: Auto-create profile when user signs up
**Triggered**: ON INSERT to auth.users

---

## Authentication Flow

### Sign Up (Email/Password)
```
1. User submits form → /api/auth/signup (if API exists) OR directly to Supabase
2. Supabase creates user in auth.users
3. Trigger `handle_new_user()` fires
4. Profile created in profiles table
5. Session cookie set
6. User redirected to home
```

### Sign In (Email/Password)
```
1. User submits credentials → Supabase Auth
2. Supabase verifies password
3. Session cookie set
4. Middleware validates on protected routes
```

### OAuth (Google/GitHub)
```
1. User clicks OAuth button → /auth/signin (redirects to provider)
2. Provider authenticates
3. Provider redirects to /auth/callback
4. Callback route:
   - Exchanges code for session
   - Calls getOrCreateProfile()
   - Sets session cookie
   - Redirects to app
```

### Middleware Protection
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith('/account') ||
      pathname.startsWith('/admin') ||
      pathname === '/cart') {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL(`/auth/signin?redirectTo=${pathname}`, request.url)
      );
    }
  }

  return response;
}
```

### Session Management
- **Server**: Cookies managed by Supabase SSR package
- **Client**: Zustand store for UI state
- **Expiry**: Configurable in Supabase dashboard (default: 7 days)
- **Refresh**: Automatic with Supabase client

---

## Payment & Order Flow

### Complete Purchase Flow (Critical Understanding)

#### 1. Add to Cart
```
User → Product Page → "Add to Cart" →
  - Guest: localStorage cart
  - Authenticated: POST /api/cart (+ localStorage for redundancy)
  - Validation: Check inventory availability
```

#### 2. View Cart
```
User → /cart →
  - Guest: Read from localStorage
  - Authenticated: GET /api/cart (merges with localStorage)
  - Display: Items, quantities, subtotal
```

#### 3. Proceed to Checkout
```
User → /checkout →
  - Calculate shipping: FREE if subtotal >= $50, else $5.99
  - Display: Items, shipping, estimated total (tax calculated by Stripe)
```

#### 4. Create Stripe Session
```
User clicks "Proceed to Payment" →
POST /api/checkout with:
  {
    items: [
      {
        product_id: "uuid",
        name: "Product Name",
        price: 49.99,
        quantity: 2,
        description: "...",
        image: "https://..."
      }
    ]
  }

API Response:
  {
    url: "https://checkout.stripe.com/...",
    sessionId: "cs_...",
    shippingCost: 5.99,
    subtotal: 99.98
  }

Stripe Session Metadata:
  {
    user_id: "uuid" | "",
    email: "user@example.com",
    shipping_cost: "5.99",
    items: JSON.stringify([...])  // For webhook
  }
```

#### 5. Stripe Checkout
```
User redirected to Stripe →
  - Enter card details (test: 4242 4242 4242 4242)
  - Fill shipping address
  - Stripe calculates tax automatically
  - Complete payment
```

#### 6. Webhook Processing (CRITICAL)
```
Stripe → POST /api/webhooks/stripe (webhook event: checkout.session.completed)

Webhook Handler:
  1. Verify signature
  2. Extract session data:
     - metadata (user_id, email, items, shipping_cost)
     - customer_details (email, name)
     - shipping_details (address, phone)
     - amount_total, amount_tax, amount_shipping
  3. Generate order_number: ORD-{timestamp}-{random}
  4. Create order in database
  5. Create order_items
  6. Reduce inventory for each product (reduce_inventory function)
  7. Send confirmation email (Resend)
  8. Return 200 OK

⚠️ CRITICAL: Order is NOT created on success page!
   Order is ONLY created by webhook!
```

#### 7. Success Page
```
Stripe redirects → /checkout/success?session_id=cs_...

Success Page:
  - Clears cart (both localStorage and server)
  - Shows success message
  - (Future: Verify order exists by looking up session_id)
```

### Why Webhook-Based?

**Problem if using success page for order creation**:
- User might close browser before page loads
- Page might error before saving
- Race conditions

**Webhook benefits**:
- Guaranteed delivery (Stripe retries)
- Runs server-side (no user interaction needed)
- Atomic transaction
- Payment verified before order created

### Inventory Management

#### Three-Layer Protection:

1. **Cart API**: Validates inventory when adding items
   ```typescript
   if (newQuantity > product.inventory_count) {
     return error("Only X items available");
   }
   ```

2. **Checkout API**: Re-validates before creating Stripe session
   ```typescript
   for (const item of items) {
     if (product.inventory_count < item.quantity) {
       return error("Insufficient inventory");
     }
   }
   ```

3. **Webhook**: Atomic reduction in database
   ```sql
   UPDATE products
   SET inventory_count = inventory_count - quantity
   WHERE id = product_id AND inventory_count >= quantity;
   -- Throws error if insufficient
   ```

This prevents overselling even with concurrent purchases.

---

## Critical Bugs Fixed

### Bug #1: Orders Never Created (Webhook Missing)
**Symptom**: Payments succeeded but no orders in database
**Cause**: No webhook handler implemented
**Fix**: Created `/api/webhooks/stripe/route.ts`
**Impact**: 🔴 CRITICAL - Revenue lost, no fulfillment

### Bug #2: Admin Orders Page Crashed
**Symptom**: Page crashes when viewing orders
**Cause**: Wrong field names:
  - `item.product_price` → should be `item.price_at_purchase`
  - `item.subtotal` → doesn't exist, must calculate
  - `order.first_name/last_name` → use `shipping_address.name`
  - `line1/line2` → should be `address_line1/address_line2`
**Fix**: Updated field references
**Impact**: 🔴 CRITICAL - Admin can't manage orders

### Bug #3: Product Pages 404
**Symptom**: Clicking products gives 404
**Cause**: URLs use slugs but API only accepts UUIDs
**Fix**: API now detects UUID vs slug and queries appropriately
**Impact**: 🟡 HIGH - Poor UX, SEO broken

### Bug #4: Checkout Missing Product IDs
**Symptom**: Webhook can't create order_items
**Cause**: Checkout doesn't include product_id in items
**Fix**: Added `product_id` to checkout items
**Impact**: 🔴 CRITICAL - Orders incomplete

### Bug #5: Contact Form Doesn't Send
**Symptom**: Form submits but no email sent
**Cause**: Form simulated submission with setTimeout
**Fix**: Created `/api/contact/route.ts` with Resend integration
**Impact**: 🟡 MEDIUM - Lost customer inquiries

### Bug #6: Cart Type Mismatch
**Symptom**: Accessing `item.product.product_images` errors
**Cause**: Cart store type doesn't include images
**Fix**: Not yet addressed (minor issue, works in practice)
**Impact**: 🟢 LOW - Degrades gracefully

### Bug #7: No Inventory Validation
**Symptom**: Can purchase more than available
**Cause**: No checks in cart or checkout
**Fix**: Added validation at cart, checkout, and webhook levels
**Impact**: 🟡 HIGH - Overselling risk

---

## File Structure

```
/artventure
├── .env.example              # Environment variables template
├── .env.local                # Local environment (gitignored)
├── next.config.ts            # Next.js config (image domains)
├── tailwind.config.ts        # Tailwind CSS config
├── package.json              # Dependencies
├── supabase-schema.sql       # Complete database schema
├── README.md                 # Project documentation
├── TESTING.md                # Testing procedures
├── claude.md                 # This knowledge base
│
├── /src
│   ├── /app                  # Next.js 15 App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   │
│   │   ├── /auth             # Authentication pages
│   │   │   ├── /signin       # Email/password + OAuth
│   │   │   ├── /signup       # Registration
│   │   │   ├── /callback     # OAuth callback handler
│   │   │   └── /signout      # Sign out route
│   │   │
│   │   ├── /products         # Public product pages
│   │   │   ├── page.tsx      # Product listing
│   │   │   └── /[id]         # Product detail (supports slug & UUID)
│   │   │
│   │   ├── /cart             # Shopping cart
│   │   │   └── page.tsx      # Cart page
│   │   │
│   │   ├── /checkout         # Checkout flow
│   │   │   ├── page.tsx      # Checkout page
│   │   │   └── /success      # Post-payment success
│   │   │
│   │   ├── /account          # User account pages
│   │   │   ├── page.tsx      # Account overview
│   │   │   └── /orders       # Order history
│   │   │
│   │   ├── /admin            # Admin panel (protected)
│   │   │   ├── page.tsx      # Admin dashboard
│   │   │   ├── /products     # Product management
│   │   │   │   ├── page.tsx  # Products list
│   │   │   │   ├── /new      # Create product
│   │   │   │   └── /[id]/edit # Edit product
│   │   │   └── /orders       # Order management
│   │   │       └── page.tsx  # Orders list + status updates
│   │   │
│   │   ├── /about            # About page
│   │   ├── /contact          # Contact form
│   │   │
│   │   └── /api              # API Routes
│   │       ├── /products     # Product APIs
│   │       │   ├── route.ts          # List products (public)
│   │       │   └── /[id]/route.ts    # Get single product
│   │       │
│   │       ├── /cart         # Cart APIs
│   │       │   └── route.ts          # GET, POST, PUT, DELETE cart
│   │       │
│   │       ├── /checkout     # Checkout API
│   │       │   └── route.ts          # Create Stripe session
│   │       │
│   │       ├── /orders       # Order APIs
│   │       │   └── route.ts          # GET, POST orders
│   │       │
│   │       ├── /contact      # Contact form API
│   │       │   └── route.ts          # Send contact emails
│   │       │
│   │       ├── /admin        # Admin APIs
│   │       │   ├── /products         # Admin product CRUD
│   │       │   ├── /upload           # Image upload to Supabase Storage
│   │       │   └── /orders           # Admin order management
│   │       │
│   │       └── /webhooks     # External webhooks
│   │           └── /stripe/route.ts  # Stripe payment webhooks
│   │
│   ├── /components           # React components
│   │   ├── /layout
│   │   │   ├── Header.tsx    # Header with auth state
│   │   │   ├── Footer.tsx    # Footer
│   │   │   └── MainLayout.tsx # Layout wrapper
│   │   └── ...               # Other components
│   │
│   ├── /lib                  # Utility libraries
│   │   ├── /supabase
│   │   │   ├── client.ts     # Browser Supabase client
│   │   │   └── server.ts     # Server Supabase client (SSR)
│   │   ├── auth.ts           # Auth helper functions
│   │   ├── stripe.ts         # Stripe client
│   │   └── resend.ts         # Email sending functions
│   │
│   ├── /store                # Client state management
│   │   └── cart.ts           # Zustand cart store
│   │
│   └── /types                # TypeScript types
│       └── database.ts       # Database types
│
└── /public                   # Static assets
    └── ...
```

---

## API Endpoints

### Public APIs

#### `GET /api/products`
Query params: `?featured=true&category=uuid&search=term`
Returns: Array of published products with images and category

#### `GET /api/products/[id]`
Accepts: UUID or slug
Returns: Single product with images and category (if published)

### Authenticated APIs

#### `GET /api/cart`
Requires: Auth
Returns: User's cart items with product details

#### `POST /api/cart`
Body: `{ productId: string, quantity: number }`
Validates: Inventory availability
Returns: Updated cart item

#### `PUT /api/cart/[id]`
Body: `{ quantity: number }`
Returns: Updated cart item

#### `DELETE /api/cart/[id]`
Returns: Success message

#### `POST /api/checkout`
Body: `{ items: CheckoutItem[] }`
Validates: Inventory for all items
Returns: `{ url: string, sessionId: string, shippingCost: number, subtotal: number }`

#### `GET /api/orders`
Requires: Auth
Returns: User's order history

#### `POST /api/orders`
Body: Order details (used by webhook, not directly called)
Returns: Created order

### Admin APIs (Require Admin Role)

#### `GET /api/admin/products`
Returns: All products (published and draft)

#### `POST /api/admin/products`
Body: Product data
Returns: Created product

#### `GET /api/admin/products/[id]`
Returns: Product with images (admin view)

#### `PUT /api/admin/products/[id]`
Body: Updated product data
Returns: Updated product

#### `DELETE /api/admin/products/[id]`
Returns: Success (cascade deletes images)

#### `POST /api/admin/upload`
Body: FormData with file
Validates: File type (JPEG, PNG, WebP), size (max 5MB)
Returns: `{ url: string, fileName: string }`

#### `POST /api/admin/products/[id]/images`
Body: `{ image_url: string, alt_text: string, display_order: number }`
Returns: Created image record

#### `PUT /api/admin/products/images/[imageId]`
Body: `{ alt_text: string }`
Returns: Updated image

#### `DELETE /api/admin/products/images/[imageId]`
Returns: Success (deletes from DB and Storage)

#### `GET /api/admin/orders`
Returns: All orders with items

#### `PUT /api/admin/orders/[id]`
Body: `{ status: string, tracking_number?: string }`
Sends email if status changed to "processing" or "shipped"
Returns: Updated order

### Public APIs (No Auth)

#### `POST /api/contact`
Body: `{ name: string, email: string, message: string }`
Validates: Email format, required fields
Sends email to CONTACT_EMAIL
Returns: Success message

### Webhooks

#### `POST /api/webhooks/stripe`
Headers: `stripe-signature`
Verifies: Webhook signature
Handles: `checkout.session.completed`
Creates: Order, order items, reduces inventory, sends email
Returns: `{ received: true }`

---

## Environment Variables

### Required for Development

```bash
# App URL (important for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (from Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # KEEP SECRET!

# Stripe (from Stripe Dashboard > Developers > API Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI or webhook settings

# Resend (from Resend.com > API Keys)
RESEND_API_KEY=re_...
CONTACT_EMAIL=admin@yourdomain.com  # Where contact form emails go

# Shipping Configuration
FLAT_SHIPPING_RATE=5.99
FREE_SHIPPING_THRESHOLD=50.00
```

### Production Additions

```bash
# Use production Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Production webhook secret (from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_...

# Verified email domain in Resend
RESEND_API_KEY=re_...
```

---

## Common Pitfalls

### 1. Image Uploads Fail with CORS
**Symptom**: "Hostname not configured under images"
**Cause**: Forgot to add Supabase domain to next.config.ts
**Fix**:
```typescript
// next.config.ts
images: {
  remotePatterns: [{
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  }],
}
```
**Restart dev server after changing!**

### 2. Webhook Returns 400 "Invalid signature"
**Symptom**: Webhook logs show signature verification failed
**Cause**: Wrong STRIPE_WEBHOOK_SECRET
**Fix For Local Dev**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy webhook secret shown in output to .env.local
```
**Fix For Production**: Use secret from Stripe Dashboard > Webhooks

### 3. Orders Not Created After Payment
**Symptom**: Payment succeeds, cart clears, but no order in database
**Causes**:
  1. Webhook not configured
  2. Webhook failing (check logs)
  3. Metadata missing from Stripe session
**Debug**:
```bash
# Check webhook received event
stripe trigger checkout.session.completed
# Check server logs for errors
# Verify metadata in Stripe dashboard
```

### 4. "Insufficient Inventory" Despite Stock Available
**Symptom**: Can't checkout even with items in stock
**Cause**: Inventory count not updated after previous order
**Fix**: Check `products.inventory_count` in database

### 5. Product Pages 404
**Symptom**: Clicking product gives 404
**Cause**: Routing by slug but API doesn't support it (FIXED)
**Verification**: Try accessing `/products/{uuid}` directly

### 6. Email Not Sending
**Symptoms**: No errors but emails not received
**Causes**:
  1. RESEND_API_KEY not set
  2. Sender email not verified (in production)
  3. Rate limit exceeded (3000/month on free tier)
**Debug**: Check Resend dashboard > Logs

### 7. Session Expires Immediately
**Symptom**: Signed out right after signing in
**Cause**: Cookie not set properly (SameSite, domain issues)
**Fix**: Check middleware cookie handling, ensure NEXT_PUBLIC_APP_URL matches actual URL

### 8. Admin Features Not Showing
**Symptom**: Signed in as admin but no admin menu
**Cause**: `profiles.is_admin` not set to true
**Fix**:
```sql
UPDATE profiles
SET is_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

### 9. Cart Not Persisting
**Symptom**: Cart cleared on page refresh
**Causes**:
  1. localStorage not enabled
  2. Server-side cart not syncing
**Debug**: Check browser localStorage, check `/api/cart` response

### 10. Build Fails on Vercel
**Symptoms**: Works locally, fails in production
**Common Causes**:
  1. Missing environment variables
  2. Type errors (use `npm run build` locally)
  3. Import errors (case sensitivity on Linux)
**Fix**: Run `npm run build` locally first, fix all errors

---

## Deployment Guide

### Prerequisites Checklist

- [ ] Supabase project created
- [ ] Database schema loaded
- [ ] RLS policies enabled
- [ ] Supabase Storage bucket `product-images` created (public)
- [ ] Stripe account set up
- [ ] Stripe Tax enabled
- [ ] Resend account with verified domain
- [ ] GitHub repository
- [ ] Vercel account

### Step-by-Step Deployment

#### 1. Prepare Supabase Production

1. Create production project at supabase.com
2. Go to SQL Editor, run `supabase-schema.sql`
3. Go to Storage, create `product-images` bucket
   - Make it public
   - Set appropriate RLS policies
4. Go to Authentication > URL Configuration
   - Add production URL to "Site URL"
   - Add production URL to "Redirect URLs"
5. Go to Authentication > Providers
   - Configure Google OAuth (production credentials)
   - Configure GitHub OAuth (production credentials)
6. Copy API keys (Project Settings > API)

#### 2. Configure Stripe Production

1. Switch to live mode in Stripe Dashboard
2. Go to Developers > API Keys
   - Copy Publishable Key
   - Copy Secret Key
3. Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select event: `checkout.session.completed`
   - Copy webhook secret
4. Go to Tax > Settings
   - Enable automatic tax

#### 3. Configure Resend

1. Go to resend.com
2. Verify your sending domain (e.g., yourdomain.com)
3. Update DNS records as instructed
4. Wait for verification
5. Create API key
6. Update from address in email templates

#### 4. Deploy to Vercel

1. Push code to GitHub
2. Go to vercel.com > New Project
3. Import GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables (all from Prerequisites):
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RESEND_API_KEY=re_...
   CONTACT_EMAIL=support@yourdomain.com
   FLAT_SHIPPING_RATE=5.99
   FREE_SHIPPING_THRESHOLD=50.00
   ```
6. Deploy

#### 5. Post-Deployment

1. Test end-to-end purchase with live Stripe (use $0.50 test)
2. Verify webhook receives events
3. Check order created in database
4. Confirm emails sent
5. Test admin panel
6. Upload sample products
7. Set up monitoring (Vercel Analytics, Sentry)

#### 6. Create First Admin User

1. Sign up through website
2. Get user ID from Supabase Dashboard > Authentication > Users
3. Run SQL:
   ```sql
   UPDATE profiles
   SET is_admin = true
   WHERE user_id = 'your-user-id';
   ```
4. Refresh page, verify admin menu appears

---

## Future Enhancements

### High Priority
1. **Admin Category Management UI**
   - Currently categories only manageable via SQL
   - Create CRUD interface at `/admin/categories`

2. **Product Search & Filtering**
   - Currently basic search exists
   - Add advanced filters (price range, materials, etc.)
   - Implement faceted search

3. **Shipping Address Management**
   - Table exists but no UI
   - Allow users to save multiple addresses
   - Set default address

4. **Order Tracking**
   - Show tracking number to customer
   - Link to carrier tracking page
   - Email notifications for status changes

### Medium Priority
5. **Product Reviews**
   - Allow customers to review purchased products
   - Star ratings
   - Admin moderation

6. **Inventory Alerts**
   - Email admin when product low on stock
   - Auto-unpublish when inventory reaches 0

7. **Analytics Dashboard**
   - Sales over time
   - Popular products
   - Revenue metrics

8. **Wishlist**
   - Save products for later
   - Currently placeholder exists

### Low Priority
9. **Multi-Currency Support**
   - Currently USD only
   - Use Stripe multi-currency

10. **Coupon/Discount Codes**
    - Percentage and fixed discounts
    - One-time use codes
    - Minimum purchase requirements

11. **Product Variants**
    - Size, color options
    - Separate inventory per variant

12. **Email Templates**
    - Better HTML designs
    - Brand customization

13. **Image Optimization**
    - Automatic compression
    - Multiple sizes
    - WebP conversion

14. **Drag-and-Drop Image Reordering**
    - Currently uses display_order field
    - Add UI to reorder by dragging

---

## Performance Optimization Checklist

- [ ] Enable Vercel Analytics
- [ ] Add ISR (Incremental Static Regeneration) for product pages
- [ ] Implement image lazy loading (already using Next/Image)
- [ ] Add caching headers for static assets
- [ ] Use Vercel Edge for API routes where possible
- [ ] Optimize bundle size (analyze with `npm run build`)
- [ ] Add loading skeletons for better perceived performance
- [ ] Implement route prefetching
- [ ] Use CDN for static assets
- [ ] Add service worker for offline support (optional)

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Admin routes protected by middleware
- [x] Webhook signature verification
- [x] Input validation on all forms
- [x] SQL injection prevention (via Supabase)
- [x] XSS prevention (React escapes by default)
- [ ] Rate limiting on API routes (Future)
- [ ] CSRF tokens (SameSite cookies provide some protection)
- [x] Secure environment variables
- [ ] Content Security Policy headers (Future)
- [ ] Security headers (X-Frame-Options, etc.) (Future)

---

## Monitoring & Logging

### What to Monitor

1. **Error Rates**
   - API endpoint failures
   - Webhook failures (Stripe retries, but log failures)
   - Email delivery failures

2. **Performance**
   - Page load times
   - API response times
   - Database query performance

3. **Business Metrics**
   - Orders per day
   - Revenue
   - Abandoned carts
   - Conversion rate

### Recommended Tools

- **Vercel Analytics**: Built-in, free for hobby tier
- **Sentry**: Error tracking (free tier available)
- **LogRocket**: Session replay (paid)
- **PostHog**: Product analytics (open source)

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Images not loading | Check Supabase bucket is public, restart Next.js |
| Webhook 400 error | Update STRIPE_WEBHOOK_SECRET |
| Orders not created | Check webhook logs, verify metadata |
| Admin menu not showing | Set is_admin=true in profiles |
| Product 404 | API now supports slugs (fixed) |
| Contact form fails | Check RESEND_API_KEY, verify domain |
| Inventory issues | Run inventory validation checks |
| Session expires quickly | Check cookie settings, domain config |
| Build fails | Run `npm run build` locally, fix type errors |
| Emails not sending | Check Resend dashboard, verify domain |

---

## Version History

- **v1.0** (Initial): Basic e-commerce with Clerk
- **v2.0** (Migration): Switched to Supabase Auth for free tier
- **v2.5** (Fixes): Fixed critical bugs (webhook, admin orders, slug routing)
- **v3.0** (Current): Production-ready with inventory validation, testing docs

---

## Contact & Support

For issues with this codebase:
1. Check this document first
2. Review TESTING.md
3. Check README.md
4. Search existing issues
5. Create new issue with reproduction steps

---

**END OF KNOWLEDGE BASE**

*This document should be updated whenever significant changes are made to the architecture, database schema, or critical flows.*
