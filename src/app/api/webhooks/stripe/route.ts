import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;

      case "payment_intent.succeeded":
        console.log("✓ Payment intent succeeded:", event.data.object.id);
        break;

      case "payment_intent.payment_failed":
        console.error("✗ Payment intent failed:", event.data.object.id);
        break;

      // These events are informational and don't require action
      case "charge.succeeded":
      case "charge.updated":
      case "payment_intent.created":
        // Silently ignore - these are handled by checkout.session.completed
        break;

      default:
        // Log unexpected event types for debugging
        console.log(`ℹ Received unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  try {
    console.log("Processing checkout session:", session.id);

    // Cast session as any to handle API version differences
    const sess = session as any;

    // Extract metadata
    const metadata = sess.metadata;
    if (!metadata) {
      throw new Error("No metadata in session");
    }

    const userId = metadata.user_id || null;
    const itemsJson = metadata.items;
    const email = sess.customer_details?.email || metadata.email;
    const shippingAddress = sess.shipping_details?.address;

    // Debug logging
    console.log("Webhook debug - shipping_details:", JSON.stringify(sess.shipping_details, null, 2));
    console.log("Webhook debug - customer_details:", JSON.stringify(sess.customer_details, null, 2));

    if (!itemsJson) {
      throw new Error("No items in metadata");
    }

    const items = JSON.parse(itemsJson);

    // Calculate totals
    const subtotal = items.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );

    // Get shipping cost from session
    const shippingCost =
      sess.total_details?.amount_shipping
        ? sess.total_details.amount_shipping / 100
        : parseFloat(metadata.shipping_cost || "0");

    // Get tax amount from session
    const taxAmount =
      sess.total_details?.amount_tax
        ? sess.total_details.amount_tax / 100
        : 0;

    const totalAmount = sess.amount_total ? sess.amount_total / 100 : 0;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Format shipping address
    const formattedShippingAddress = shippingAddress
      ? {
          name: sess.shipping_details?.name || "",
          address_line1: shippingAddress.line1 || "",
          address_line2: shippingAddress.line2 || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          postal_code: shippingAddress.postal_code || "",
          country: shippingAddress.country || "",
          phone: sess.customer_details?.phone || "",
        }
      : {
          name: sess.customer_details?.name || "",
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
          phone: sess.customer_details?.phone || "",
        };

    // Create order in database with 'paid' status since payment was successful
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert({
        order_number: orderNumber,
        user_id: userId,
        email: email!,
        shipping_address: formattedShippingAddress,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        stripe_payment_id: sess.payment_intent as string,
        status: "processing", // Payment succeeded, order is now being processed
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    console.log("Order created:", (order as any).id);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: (order as any).id,
      product_id: item.product_id,
      product_name: item.name,
      price_at_purchase: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      throw itemsError;
    }

    console.log("Order items created");

    // Reduce inventory for each product
    for (const item of items) {
      const { error: inventoryError } = await supabaseAdmin.rpc(
        "reduce_inventory",
        {
          product_id: item.product_id,
          quantity: item.quantity,
        } as any
      );

      if (inventoryError) {
        console.error(
          `Error reducing inventory for product ${item.product_id}:`,
          inventoryError
        );
        // Continue processing other items even if one fails
      }
    }

    console.log("Inventory reduced");

    // Get full order with items for email
    const { data: fullOrder } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items (*)
      `
      )
      .eq("id", (order as any).id)
      .single();

    // Send confirmation email
    if (fullOrder) {
      try {
        await sendOrderConfirmation(fullOrder);
        console.log("Confirmation email sent");
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
        // Don't throw - order is created, email is not critical
      }
    }

    console.log("Checkout complete processed successfully");
  } catch (error) {
    console.error("Error in handleCheckoutComplete:", error);
    throw error;
  }
}
