import Stripe from "stripe";

// Allow build to proceed without Stripe configured
// The actual runtime will fail if STRIPE_SECRET_KEY is not set when called
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build', {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});
