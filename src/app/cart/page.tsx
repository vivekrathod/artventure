"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { useCartStore } from "@/store/cart";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  const totalPrice = getTotalPrice();

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      toast.success("Item removed from cart");
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success("Item removed from cart");
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
              Start shopping to add items to your cart
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => {
                  // Get primary image (lowest display_order)
                  const images = item.product.product_images || [];
                  const sortedImages = [...images].sort(
                    (a: any, b: any) => a.display_order - b.display_order
                  );
                  const primaryImage = sortedImages[0];

                  return (
                    <div
                      key={item.product.id}
                      className="flex gap-4 rounded-lg bg-white p-4 shadow-md"
                    >
                      <Link
                        href={`/products/${item.product.slug || item.product.id}`}
                        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200"
                      >
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url}
                            alt={primaryImage.alt_text || item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/products/${item.product.slug || item.product.id}`}
                            className="font-semibold text-gray-900 hover:text-rose-600"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-1 text-sm text-gray-600">
                            ${item.product.price.toFixed(2)} each
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-lg border">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-1 text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="font-semibold text-rose-600">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Total</span>
                      <span className="text-rose-600">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-lg bg-rose-600 py-3 text-center text-white transition-colors hover:bg-rose-700"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/products"
                  className="mt-4 block text-center text-rose-600 hover:underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
