# Artisan Beads - Handmade Jewelry E-Commerce (MVP - Cost-Optimized)

A modern, elegant e-commerce website for selling handmade beaded jewelry built with a **100% FREE-tier** technology stack.

## 🎯 Technology Stack

- **Next.js 15** - React framework
- **Supabase Auth** - Authentication (FREE: Unlimited users)
- **Supabase Database** - PostgreSQL (FREE: 500MB)
- **Supabase Storage** - File storage (FREE: 1GB)
- **Stripe** - Payments (FREE: Pay 2.9% + $0.30 per transaction only)
- **Resend** - Transactional emails (FREE: 3,000 emails/month)
- **Vercel** - Hosting (FREE: 100GB bandwidth)

### 💰 **Monthly Cost: $0** (until you scale)

---

## ✅ Completed Features

### Phase 1: Authentication Foundation
- ✅ Supabase Auth integration with SSR
- ✅ Email/password authentication
- ✅ Magic link (passwordless) login
- ✅ Social login (Google, GitHub)
- ✅ Auth middleware for route protection
- ✅ Profile creation on signup
- ✅ Admin role management via RLS

### Database Schema
- ✅ Complete database schema with RLS policies
- ✅ Tables: profiles, categories, products, product_images, orders, order_items, cart_items, shipping_addresses
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Admin helper functions
- ✅ Auto-updated timestamps

### Infrastructure
- ✅ Supabase client (browser) configuration
- ✅ Supabase server client with cookie handling
- ✅ Authentication helper functions
- ✅ Environment variables setup

---

## 🚧 Remaining Work

### Critical (Must Complete)

1. **Update Header Component** - Replace Clerk UserButton with Supabase auth
2. **Update All API Routes** - Replace Clerk auth with Supabase
3. **Update Page Components** - Remove Clerk hooks, use Supabase
4. **TypeScript Types** - Update for new schema
5. **Resend Email Service** - Set up email templates
6. **Product Categories** - Implement category system
7. **Image Gallery** - Multi-image upload for products
8. **Search & Filters** - Product search with category/price filters
9. **Checkout Updates** - Add Stripe Tax + flat shipping
10. **Address Management** - User shipping addresses CRUD

### Components Needing Updates

#### Header.tsx (CRITICAL)
Currently uses Clerk's `useUser()` and `UserButton`. Needs Supabase client-side auth:

```typescript
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Check admin status
        supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => setIsAdmin(data?.is_admin || false));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header>
      {/* ... */}
      {user ? (
        <>
          <div className="flex items-center gap-2">
            <span>{user.email}</span>
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
          {isAdmin && <Link href="/admin">Admin</Link>}
        </>
      ) : (
        <Link href="/auth/signin">Sign In</Link>
      )}
    </header>
  );
}
```

#### Account Pages
Replace `auth()` and `currentUser()` from Clerk with:

```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

#### API Routes
Replace Clerk's `auth()` with:

```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your logic here
}
```

---

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to **SQL Editor** and run `supabase-schema.sql`
4. Go to **Authentication > Providers**:
   - Enable Email
   - Enable Google OAuth (add client ID/secret)
   - Enable GitHub OAuth (add client ID/secret)
5. Go to **Storage** and create bucket:
   - Name: `product-images`
   - Make it **public**
6. Copy your credentials:
   - Project URL
   - Anon (public) key
   - Service role key (keep secret!)

### 3. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers > API keys
3. Enable Stripe Tax:
   - Dashboard > Tax > Settings
   - Enable automatic tax calculation
4. Set up webhook for `/api/webhooks/stripe`

### 4. Set Up Resend

1. Create account at [resend.com](https://resend.com)
2. Get API key
3. Verify your domain (or use onboarding domain for testing)

### 5. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

RESEND_API_KEY=re_xxx

NEXT_PUBLIC_SITE_URL=http://localhost:3000
FLAT_SHIPPING_RATE=5.99
FREE_SHIPPING_THRESHOLD=50.00
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create Admin User

1. Sign up through the website
2. In Supabase SQL Editor:
```sql
UPDATE profiles
SET is_admin = true
WHERE user_id = 'your-user-id-from-auth-users-table';
```

---

## 🗂️ Project Structure

```
/src
  /app
    /auth
      /signin       - Sign in page
      /signup       - Sign up page
      /callback     - OAuth callback
      /signout      - Sign out API
    /admin          - Admin dashboard (needs update)
    /products       - Product pages (needs update)
    /cart           - Shopping cart (needs update)
    /checkout       - Checkout flow (needs update)
    /account        - User account (needs update)
    /about          - About page
    /contact        - Contact page
    /api
      /products     - Product API (needs update)
      /orders       - Orders API (needs update)
      /cart         - Cart API (needs update)
      /checkout     - Stripe checkout (needs update)
      /admin        - Admin APIs (needs update)
  /components
    /layout
      Header.tsx    - NEEDS UPDATE
      Footer.tsx    - OK
      MainLayout.tsx - OK
  /lib
    /supabase
      client.ts     - ✅ Complete
      server.ts     - ✅ Complete
    auth.ts         - ✅ Complete
    stripe.ts       - OK (may need tax updates)
  /store
    cart.ts         - OK (client-side only)
  /types
    database.ts     - NEEDS UPDATE
```

---

##Files Needing Updates

### High Priority
1. `src/components/layout/Header.tsx` - Remove Clerk, add Supabase
2. `src/types/database.ts` - Add new types (Category, ShippingAddress, etc.)
3. `src/app/api/*` - All API routes need Supabase auth
4. `src/app/account/**` - Update with Supabase
5. `src/app/admin/**` - Update with Supabase

### Medium Priority
6. `src/app/products/**` - Add category filtering
7. `src/app/cart/page.tsx` - Update auth checks
8. `src/app/checkout/**` - Add Stripe Tax, flat shipping
9. Create `src/lib/resend.ts` - Email service
10. Create email templates in `src/emails/`

### To Implement
11. Category management pages
12. Multi-image upload for products
13. Product search and filtering
14. Shipping address management
15. Order tracking system

---

## 🔑 Key Features to Implement

### Email Notifications (Resend)
Create `src/lib/resend.ts`:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(order: any) {
  await resend.emails.send({
    from: "orders@yourdomain.com",
    to: order.email,
    subject: `Order Confirmation #${order.order_number}`,
    html: `<h1>Thank you for your order!</h1>...`,
  });
}
```

### Flat-Rate Shipping
Update checkout to use:
```typescript
const subtotal = calculateSubtotal(items);
const shippingCost =
  subtotal >= parseFloat(process.env.FREE_SHIPPING_THRESHOLD!)
    ? 0
    : parseFloat(process.env.FLAT_SHIPPING_RATE!);
```

### Stripe Tax Integration
```typescript
const session = await stripe.checkout.sessions.create({
  automatic_tax: { enabled: true },
  // ... other options
});
```

---

## 🚀 Deployment to Vercel

```bash
# Push to GitHub
git push origin main

# Deploy to Vercel
# 1. Import project in Vercel dashboard
# 2. Add all environment variables
# 3. Deploy
```

**Important**: Update these after deployment:
- Supabase Auth: Add Vercel URL to allowed redirects
- Stripe: Update webhook endpoint to Vercel URL

---

## 📊 Current Progress

**Phase 1 (Completed):** Authentication & Database
- ✅ Supabase Auth setup
- ✅ Database schema with RLS
- ✅ Auth middleware
- ✅ Sign in/up pages

**Phase 2 (In Progress):** Application Layer
- 🚧 Update all components for Supabase
- 🚧 Implement missing features
- ⏳ Resend email integration
- ⏳ Categories & search
- ⏳ Multi-image upload

**Phase 3 (Pending):** Final Features
- ⏳ Stripe Tax integration
- ⏳ Order tracking
- ⏳ Admin analytics
- ⏳ Testing & optimization

---

## 💡 Next Steps

1. **Update Header component** (see code example above)
2. **Update all API routes** to use Supabase auth
3. **Update account/admin pages** with Supabase
4. **Implement Resend email service**
5. **Add category system**
6. **Complete checkout with Stripe Tax**

---

## 📝 License

MIT

---

## 🙏 Support

For issues: [GitHub Issues](https://github.com/your-repo/issues)
