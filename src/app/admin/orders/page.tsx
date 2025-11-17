"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { OrderWithItems } from "@/types/database";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 403) {
        toast.error("Unauthorized access");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("Order status updated");
        fetchOrders();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Manage Orders
          </h1>

          <div className="mt-8 space-y-6">
            {orders.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center shadow-md">
                <p className="text-gray-600">No orders found</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg bg-white p-6 shadow-md"
                  data-testid="order-row"
                >
                  {/* Order Header */}
                  <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Customer: {order.email}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        Total: ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900">
                        Order Status
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getStatusColor(
                          order.status
                        )}`}
                        data-testid="order-status"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900">Items</h4>
                    <div className="mt-2 space-y-2">
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
                  </div>

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Shipping Address
                      </h4>
                      <p className="mt-2 text-sm text-gray-600">
                        {order.shipping_address.name}
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
                        {order.shipping_address.phone && (
                          <>
                            <br />
                            Phone: {order.shipping_address.phone}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
