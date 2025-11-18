import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    // Validate inventory for all items before creating checkout session
    for (const item of items) {
      const productId = item.product_id || item.id;

      if (!productId) {
        return NextResponse.json(
          { error: "Invalid item: missing product ID" },
          { status: 400 }
        );
      }

      const { data: product, error } = await supabaseAdmin
        .from("products")
        .select("inventory_count, name, is_published")
        .eq("id", productId)
        .single();

      if (error || !product) {
        return NextResponse.json(
          { error: `Product not found: ${item.name}` },
          { status: 404 }
        );
      }

      if (!(product as any).is_published) {
        return NextResponse.json(
          { error: `Product no longer available: ${(product as any).name}` },
          { status: 400 }
        );
      }

      if ((product as any).inventory_count < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient inventory for ${(product as any).name}. Only ${(product as any).inventory_count} available.`,
          },
          { status: 400 }
        );
      }
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
    const lineItems = items.map((item: any) => {
      const productData: any = {
        name: item.name,
        images: item.image ? [item.image] : [],
      };

      // Only include description if it's not empty
      if (item.description && item.description.trim() !== "") {
        productData.description = item.description;
      }

      return {
        price_data: {
          currency: "usd",
          product_data: productData,
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

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
      });
    }

    // Prepare metadata with items (ensure product_id is included)
    const metadataItems = items.map((item: any) => ({
      product_id: item.product_id || item.id, // Support both formats
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

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
        user_id: user?.id || "",
        email: user?.email || "",
        shipping_cost: shippingCost.toString(),
        items: JSON.stringify(metadataItems), // Serialize items for webhook
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "NZ"],
      },
      phone_number_collection: {
        enabled: true,
      },
      ...(process.env.STRIPE_TAX_ENABLED === "true" && {
        automatic_tax: {
          enabled: true,
        },
      }),
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
