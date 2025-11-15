import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const FLAT_SHIPPING_RATE = parseFloat(process.env.FLAT_SHIPPING_RATE || "5.99");
const FREE_SHIPPING_THRESHOLD = parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "50.00");

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const { items, successUrl, cancelUrl } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Calculate subtotal
    const subtotal = items.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );

    // Determine shipping cost
    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || "",
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
      tax_behavior: "exclusive" as const,
    }));

    // Add shipping as a line item if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
            description: `Flat rate shipping ($${FLAT_SHIPPING_RATE}). Free shipping on orders over $${FREE_SHIPPING_THRESHOLD}`,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
        tax_behavior: "exclusive" as const,
      });
    }

    // Create checkout session with automatic tax
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        user_id: user?.id || "guest",
        shipping_cost: shippingCost.toString(),
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "NZ"],
      },
      phone_number_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },
      customer_email: user?.email,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      shippingCost,
      subtotal,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
