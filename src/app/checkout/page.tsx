"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useCartStore } from "@/store/cart";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);

  const totalPrice = getTotalPrice();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      if (items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      const checkoutItems = items.map((item) => ({
        product_id: item.product.id, // Required for order creation
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        quantity: item.quantity,
        image: (item.product as any).product_images?.[0]?.image_url,
      }));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: checkoutItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to proceed to checkout");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-12">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400" />
            <h1 className="mt-4 font-playfair text-3xl font-bold text-gray-900">
              Your Cart is Empty
            </h1>
            <p className="mt-2 text-gray-600">
              Add items to your cart before checking out
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-rose-600 px-8 py-3 text-white transition-colors hover:bg-rose-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <div className="mt-8 space-y-8">
            {/* Order Summary */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between border-b pb-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span className="text-rose-600">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Information
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You will be redirected to Stripe to complete your payment
                securely.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Secure payment processing
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Multiple payment methods accepted
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Your information is encrypted
                </li>
              </ul>
            </div>

            {/* Checkout Button */}
            <div className="flex gap-4">
              <Link
                href="/cart"
                className="flex-1 rounded-lg border-2 border-gray-300 py-3 text-center text-gray-900 transition-colors hover:border-rose-600 hover:text-rose-600"
              >
                Back to Cart
              </Link>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 rounded-lg bg-rose-600 py-3 text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? "Processing..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
