import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/resend";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch orders by user_id OR email (in case order was placed before login)
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          price_at_purchase,
          quantity
        )
      `
      )
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = await request.json();

    const {
      email,
      shipping_address,
      shipping_cost,
      tax_amount,
      total_amount,
      items,
      stripe_payment_id,
    } = body;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert({
        order_number: orderNumber,
        user_id: user?.id || null,
        email,
        shipping_address,
        shipping_cost,
        tax_amount,
        total_amount,
        stripe_payment_id,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: (order as any).id,
      product_id: item.product_id,
      product_name: item.product_name,
      price_at_purchase: item.price_at_purchase,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Get full order with items for email
    const { data: fullOrder } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          price_at_purchase,
          quantity
        )
      `
      )
      .eq("id", (order as any).id)
      .single();

    // Send order confirmation email
    if (fullOrder) {
      try {
        await sendOrderConfirmation(fullOrder);
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
        // Don't fail the order creation if email fails
      }
    }

    // Clear cart if user is logged in
    if (user) {
      await supabaseAdmin.from("cart_items").delete().eq("user_id", user.id);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error in orders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
