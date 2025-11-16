# Comprehensive Testing Guide

This document provides detailed testing procedures for all features of the handmade jewelry e-commerce platform.

## Prerequisites

Before testing, ensure:
- [ ] All environment variables are set in `.env.local`
- [ ] Database schema is loaded in Supabase
- [ ] Supabase Storage bucket `product-images` is created and public
- [ ] Stripe webhook is configured (use Stripe CLI for local testing)
- [ ] Development server is running (`npm run dev`)

---

## 1. Authentication Testing

### 1.1 Email/Password Signup
1. Navigate to `/auth/signup`
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123!
3. Click "Sign Up"
4. **Expected**:
   - Redirected to home page
   - Header shows user email
   - Profile created in `profiles` table

### 1.2 Email/Password Sign In
1. Navigate to `/auth/signin`
2. Enter credentials from signup
3. Click "Sign In"
4. **Expected**: Logged in successfully

### 1.3 Magic Link Authentication
1. Navigate to `/auth/signin`
2. Click "Sign in with magic link"
3. Enter email address
4. Check email inbox for magic link
5. Click link
6. **Expected**: Logged in automatically

### 1.4 Google OAuth
1. Navigate to `/auth/signin`
2. Click "Continue with Google"
3. Complete Google authentication
4. **Expected**:
   - Logged in
   - Profile auto-created
   - Redirected to home

### 1.5 GitHub OAuth
1. Navigate to `/auth/signin`
2. Click "Continue with GitHub"
3. Complete GitHub authentication
4. **Expected**: Same as Google OAuth

### 1.6 Sign Out
1. Click user menu in header
2. Click "Sign Out"
3. **Expected**:
   - Logged out
   - Redirected to home
   - Header shows "Sign In" button

### 1.7 Protected Routes
1. Sign out
2. Try to access `/account`
3. **Expected**: Redirected to `/auth/signin`
4. Sign in
5. **Expected**: Redirected back to `/account`

---

## 2. Admin Features Testing

### 2.1 Create Admin User
1. Sign up as a regular user
2. Get user ID from Supabase `auth.users` table
3. Run SQL:
   ```sql
   UPDATE profiles
   SET is_admin = true
   WHERE user_id = 'your-user-id';
   ```
4. Refresh page
5. **Expected**: "Admin" link appears in header

### 2.2 Product Creation
1. Navigate to `/admin/products`
2. Click "Add Product"
3. Fill in all fields:
   - Name: Handmade Beaded Bracelet
   - Description: Beautiful handcrafted bracelet
   - Price: 49.99
   - Inventory Count: 10
   - Materials: Glass beads, silver wire
   - Dimensions: 7 inches
   - Care Instructions: Avoid water
4. Upload 2-3 product images
5. Add alt text to each image
6. Check "Published"
7. Check "Featured" (optional)
8. Click "Create Product"
9. **Expected**:
   - Success message
   - Redirected to products list
   - Product appears in list
   - Images stored in Supabase Storage

### 2.3 Product Editing
1. In admin products list, click edit icon
2. Modify product name
3. Upload new image
4. Delete one existing image
5. Update alt text
6. Click "Save Changes"
7. **Expected**:
   - Changes saved
   - New image appears
   - Deleted image removed from storage

### 2.4 Product Deletion
1. In admin products list, click delete icon
2. Confirm deletion
3. **Expected**:
   - Product removed from list
   - Product no longer visible on storefront
   - Images remain in storage (manual cleanup needed)

### 2.5 Order Management
1. Navigate to `/admin/orders`
2. **Expected**: List of all orders
3. Click on an order
4. Change status to "Processing"
5. **Expected**: Email sent to customer
6. Add tracking number
7. Change status to "Shipped"
8. **Expected**: Shipping email sent
9. Verify order details display correctly:
   - Order items with correct prices
   - Shipping address formatted properly
   - Totals calculated correctly

---

## 3. Product Browsing Testing

### 3.1 Homepage
1. Navigate to `/`
2. **Expected**:
   - Featured products displayed
   - Hero section visible
   - All images load properly

### 3.2 Products Page
1. Navigate to `/products`
2. **Expected**:
   - All published products displayed
   - Product cards show image, name, price
3. Test category filter (if categories exist)
4. Test search functionality
5. **Expected**: Results update correctly

### 3.3 Product Detail Page (Slug Routing)
1. Click on a product from products page
2. **Expected**:
   - URL uses slug (e.g., `/products/handmade-beaded-bracelet`)
   - Product details load correctly
   - All images displayed in gallery
   - Add to cart button visible

### 3.4 Product Detail Page (Direct ID)
1. Navigate to product using UUID (from database)
2. **Expected**: Product loads correctly

---

## 4. Shopping Cart Testing

### 4.1 Add to Cart (Guest User)
1. Sign out if signed in
2. View a product
3. Click "Add to Cart"
4. **Expected**:
   - Success message
   - Cart count updates in header
   - Item stored in localStorage

### 4.2 Add to Cart (Authenticated User)
1. Sign in
2. Add product to cart
3. **Expected**:
   - Item added to server-side cart
   - Synced across sessions

### 4.3 Cart Page
1. Navigate to `/cart`
2. **Expected**:
   - All cart items displayed
   - Product images, names, prices shown
   - Quantity controls work
   - Subtotal calculated correctly

### 4.4 Update Quantity
1. Change quantity using +/- buttons
2. **Expected**:
   - Quantity updates
   - Subtotal recalculates
   - Changes persist after refresh

### 4.5 Remove Item
1. Click "Remove" on an item
2. **Expected**:
   - Item removed
   - Totals updated
   - If last item, show empty cart message

### 4.6 Inventory Validation
1. Add 5 items to cart
2. As admin, reduce product inventory to 3
3. Try to checkout
4. **Expected**: Error message about insufficient stock
5. Try to add more items to cart
6. **Expected**: Cannot exceed available inventory

---

## 5. Checkout & Payment Testing

### 5.1 Checkout Process
1. Add items to cart
2. Navigate to `/cart`
3. Click "Proceed to Checkout"
4. **Expected**:
   - Redirected to `/checkout`
   - Cart items displayed
   - Shipping cost calculated:
     - $5.99 if subtotal < $50
     - Free if subtotal >= $50

### 5.2 Stripe Checkout
1. On checkout page, click "Proceed to Payment"
2. **Expected**: Redirected to Stripe Checkout
3. Enter test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Fill in shipping address
7. Complete payment
8. **Expected**:
   - Payment succeeds
   - Redirected to `/checkout/success`

### 5.3 Webhook Processing
**Note**: Requires Stripe CLI for local testing

1. Start Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. Complete a test purchase
3. **Expected** (check server logs):
   - Webhook received
   - Signature verified
   - Order created in database
   - Order items created
   - Inventory reduced
   - Confirmation email sent

### 5.4 Order Verification
1. Check Supabase `orders` table
2. **Expected**:
   - New order with correct:
     - Order number
     - User ID
     - Email
     - Shipping address (all fields populated)
     - Shipping cost
     - Tax amount
     - Total amount
     - Stripe payment ID
     - Status: "pending"
3. Check `order_items` table
4. **Expected**:
   - Items linked to order
   - Correct product_id, name, price, quantity

### 5.5 Inventory Reduction
1. Note product inventory before purchase
2. Complete purchase
3. Check product inventory
4. **Expected**: Reduced by quantity purchased

### 5.6 Email Confirmation
1. Check email inbox (or Resend dashboard in dev)
2. **Expected**:
   - Order confirmation email received
   - Contains order number
   - Lists all items
   - Shows totals
   - Includes shipping address

### 5.7 Failed Payment
1. Use test card `4000 0000 0000 9995` (declined)
2. **Expected**:
   - Payment declined
   - No order created
   - Inventory not reduced
   - Redirected to cart/cancel URL

### 5.8 Insufficient Inventory During Checkout
1. Add 5 items to cart
2. As admin, set product inventory to 2
3. Try to checkout
4. **Expected**:
   - Error: "Insufficient inventory..."
   - Cannot proceed to Stripe
   - Clear message about available stock

---

## 6. Order Management (Customer)

### 6.1 View Order History
1. Sign in
2. Navigate to `/account/orders`
3. **Expected**:
   - All user's orders displayed
   - Most recent first
   - Shows order number, date, status, total

### 6.2 View Order Details
1. Click on an order
2. **Expected**:
   - Order items listed
   - Prices "at purchase" (not current prices)
   - Subtotal, shipping, tax, total shown
   - Shipping address displayed
   - Tracking number (if shipped)

### 6.3 Order Status Updates
1. Have admin change order status
2. Refresh order page
3. **Expected**:
   - Status updated
   - If shipped: tracking number appears

---

## 7. Account Management

### 7.1 Account Page
1. Navigate to `/account`
2. **Expected**:
   - User name displayed
   - Email shown
   - Join date visible
   - Links to orders, settings

---

## 8. Contact Form Testing

### 8.1 Submit Contact Form
1. Navigate to `/contact`
2. Fill in:
   - Name: Test Customer
   - Email: test@example.com
   - Subject: Product inquiry
   - Message: Detailed message text
3. Click "Send Message"
4. **Expected**:
   - Success message
   - Form cleared
   - Email sent to CONTACT_EMAIL (check Resend dashboard)

### 8.2 Form Validation
1. Try submitting with empty fields
2. **Expected**: HTML5 validation prevents submission
3. Enter invalid email
4. **Expected**: Backend validation rejects

### 8.3 Email Receipt
1. Check email at CONTACT_EMAIL
2. **Expected**:
   - Email received
   - Contains customer name, email
   - Includes full message
   - Reply-to set to customer email

---

## 9. Image Upload Testing

### 9.1 Product Image Upload
1. Go to admin product creation
2. Upload various formats:
   - JPEG
   - PNG
   - WebP
3. Try uploading invalid file (PDF)
4. **Expected**: Rejected with error
5. Try uploading large file (>5MB)
6. **Expected**: Rejected with size error

### 9.2 Image Display
1. Upload product images
2. View product on storefront
3. **Expected**:
   - Images load correctly
   - Proper aspect ratio
   - No CORS errors
   - Alt text set for accessibility

### 9.3 Image Deletion
1. Edit product
2. Delete an image
3. Save
4. **Expected**:
   - Image removed from product
   - File removed from Supabase Storage (check manually)

---

## 10. Edge Cases & Error Handling

### 10.1 Concurrent Inventory Updates
1. Open product page in two browsers
2. In both, add max inventory to cart
3. Try to checkout from both
4. **Expected**:
   - First checkout succeeds
   - Second fails with inventory error

### 10.2 Product Unpublished After Adding to Cart
1. Add product to cart
2. As admin, unpublish product
3. Try to checkout
4. **Expected**: Error about product unavailability

### 10.3 Session Expiry
1. Sign in
2. Wait for session to expire (or manually delete cookies)
3. Try to access protected route
4. **Expected**: Redirected to sign in

### 10.4 Invalid Product Slug
1. Navigate to `/products/nonexistent-slug`
2. **Expected**: 404 error or "Product not found"

### 10.5 Malformed Requests
1. Try to add negative quantity to cart
2. **Expected**: Validation error
3. Try to checkout with empty cart
4. **Expected**: Error message

---

## 11. Performance Testing

### 11.1 Page Load Times
- [ ] Homepage loads in < 2s
- [ ] Product pages load in < 2s
- [ ] Images lazy load
- [ ] No unnecessary re-renders

### 11.2 Image Optimization
- [ ] Images under 1MB each
- [ ] Next.js Image component used
- [ ] Proper caching headers

---

## 12. Security Testing

### 12.1 SQL Injection
1. Try SQL in search: `' OR '1'='1`
2. **Expected**: No SQL injection (Supabase protects)

### 12.2 XSS Prevention
1. Create product with name: `<script>alert('xss')</script>`
2. **Expected**: Rendered as text, not executed

### 12.3 CSRF Protection
1. Try submitting forms from external site
2. **Expected**: SameSite cookies prevent

### 12.4 Authentication Bypass
1. Try accessing `/admin` without signing in
2. **Expected**: Redirected to sign in
3. Try as non-admin user
4. **Expected**: 403 Forbidden

### 12.5 Row Level Security
1. As user A, try to access user B's cart via API
2. **Expected**: RLS prevents unauthorized access

---

## 13. Mobile Responsiveness

Test on mobile devices or browser dev tools:

- [ ] Navigation menu works on mobile
- [ ] Product grid stacks properly
- [ ] Cart displays correctly
- [ ] Checkout form is usable
- [ ] Images scale appropriately
- [ ] Touch interactions work smoothly

---

## 14. Cross-Browser Testing

Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Verify:
- [ ] All features work
- [ ] Layout consistent
- [ ] No console errors
- [ ] Stripe checkout works

---

## Common Issues & Solutions

### Webhook not working locally
**Solution**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy webhook secret to .env.local
```

### Images not loading
**Solution**:
- Check Supabase Storage bucket is public
- Verify Next.js image config includes Supabase domain
- Restart dev server after config changes

### Orders not created
**Solution**:
- Check webhook is receiving events
- Check server logs for errors
- Verify STRIPE_WEBHOOK_SECRET is set correctly

### Email not sending
**Solution**:
- Check RESEND_API_KEY is set
- Verify sender email is verified in Resend
- Check Resend dashboard for errors

### Inventory not reducing
**Solution**:
- Verify reduce_inventory() function exists in database
- Check webhook successfully processes
- Look for errors in server logs

---

## Automation Testing (Future)

Suggested tools for automated testing:

- **E2E**: Playwright or Cypress
- **Unit**: Jest + React Testing Library
- **API**: Supertest
- **Performance**: Lighthouse CI

---

## Checklist Before Production

- [ ] All manual tests passed
- [ ] No console errors
- [ ] All environment variables set for production
- [ ] Stripe webhook configured with production endpoint
- [ ] Resend email domain verified
- [ ] Supabase production database configured
- [ ] RLS policies tested
- [ ] Image uploads working
- [ ] Payment flow tested with live mode (small amounts)
- [ ] Email notifications working
- [ ] Mobile responsiveness verified
- [ ] Cross-browser tested
- [ ] Security headers configured
- [ ] SSL certificate active
- [ ] Analytics set up (optional)
- [ ] Error monitoring configured (Sentry, etc.)

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test orders
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE email LIKE '%test%'
);
DELETE FROM orders WHERE email LIKE '%test%';

-- Delete test products
DELETE FROM product_images WHERE product_id IN (
  SELECT id FROM products WHERE name LIKE '%Test%'
);
DELETE FROM products WHERE name LIKE '%Test%';

-- Delete test users (careful!)
DELETE FROM profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);
-- Then delete from Supabase Auth UI
```

---

## Report Issues

If you find bugs during testing:

1. Note the exact steps to reproduce
2. Include error messages from console
3. Screenshot the issue
4. Check server logs
5. Document expected vs actual behavior
6. Create issue in repository
