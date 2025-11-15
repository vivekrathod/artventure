"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Package, Calendar, DollarSign, Truck } from "lucide-react";
import { OrderWithItems } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndFetchOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin?redirectTo=/account/orders");
        return;
      }

      await fetchOrders();
    }

    checkAuthAndFetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Order History
          </h1>

          {orders.length === 0 ? (
            <div className="mt-8 rounded-lg bg-white p-12 text-center shadow-md">
              <Package className="mx-auto h-24 w-24 text-gray-400" />
              <h2 className="mt-4 font-playfair text-2xl font-bold text-gray-900">
                No Orders Yet
              </h2>
              <p className="mt-2 text-gray-600">
                You haven't placed any orders yet. Start shopping to see your
                orders here!
              </p>
              <a
                href="/products"
                className="mt-6 inline-block rounded-full bg-rose-600 px-8 py-3 text-white transition-colors hover:bg-rose-700"
              >
                Browse Products
              </a>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg bg-white p-6 shadow-md"
                >
                  {/* Order Header */}
                  <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${order.total_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-4 space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.product_name}
                          </p>
                          <p className="text-gray-600">
                            Quantity: {item.quantity} × $
                            {item.price_at_purchase.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.price_at_purchase * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>
                        $
                        {(
                          order.total_amount -
                          order.shipping_cost -
                          order.tax_amount
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>${order.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>${order.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.tracking_number && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-purple-50 p-3">
                      <Truck className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900">
                          Tracking Number
                        </p>
                        <p className="text-sm text-purple-700">
                          {order.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Shipping Address
                      </h4>
                      <p className="mt-2 text-sm text-gray-600">
                        {order.shipping_address.full_name}
                        <br />
                        {order.shipping_address.address_line1}
                        {order.shipping_address.address_line2 &&
                          `, ${order.shipping_address.address_line2}`}
                        <br />
                        {order.shipping_address.city},{" "}
                        {order.shipping_address.state}{" "}
                        {order.shipping_address.postal_code}
                        <br />
                        {order.shipping_address.country}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
