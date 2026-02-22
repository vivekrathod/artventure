// ============================================================================
// USER PROFILES
// ============================================================================
export interface Profile {
  user_id: string;
  full_name?: string;
  phone?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CATEGORIES
// ============================================================================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

// ============================================================================
// PRODUCTS
// ============================================================================
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  category_id?: string;
  inventory_count: number;
  weight_oz?: number;
  materials?: string;
  dimensions?: string;
  care_instructions?: string;
  is_published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  alt_text?: string;
  created_at: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  category?: Category;
}

// ============================================================================
// ORDERS
// ============================================================================
export interface ShippingAddress {
  name: string; // Changed from full_name to match Stripe webhook format
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  shipping_address: ShippingAddress;
  tracking_number?: string;
  stripe_payment_id?: string;
  stripe_charge_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  quantity: number;
  price_at_purchase: number;
  product_name: string;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// ============================================================================
// CART
// ============================================================================
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: ProductWithImages;
}

// ============================================================================
// SAVED ADDRESSES
// ============================================================================
export interface SavedShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
}

// ============================================================================
// STRIPE
// ============================================================================
export interface CheckoutItem {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutSession {
  items: CheckoutItem[];
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
}
