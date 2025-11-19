import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when API key is not set
// This allows the build to succeed in CI without requiring secrets
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Export stripe as a getter to maintain compatibility while keeping lazy initialization
export const stripe = {
  get checkout() {
    return getStripe().checkout;
  },
  get webhooks() {
    return getStripe().webhooks;
  },
  get customers() {
    return getStripe().customers;
  },
  get paymentIntents() {
    return getStripe().paymentIntents;
  },
  // Add other Stripe properties as needed
};
