"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useCartStore } from "@/store/cart";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Clear the cart after successful checkout
    clearCart();
  }, [clearCart]);

  return (
    <MainLayout>
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-12">
        <div className="max-w-md text-center">
          <CheckCircle className="mx-auto h-24 w-24 text-green-600" />
          <h1 className="mt-4 font-playfair text-3xl font-bold text-gray-900">
            Order Successful!
          </h1>
          <p className="mt-2 text-gray-600">
            Thank you for your purchase. Your order has been placed
            successfully.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            You will receive an email confirmation shortly with your order
            details.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <Link
              href="/account/orders"
              className="rounded-full bg-rose-600 px-8 py-3 text-white transition-colors hover:bg-rose-700"
            >
              View Order History
            </Link>
            <Link
              href="/products"
              className="rounded-full border-2 border-gray-900 px-8 py-3 text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    }>
      <SuccessContent />
    </Suspense>
  );
}
