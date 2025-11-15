import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuth();

    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .select(
        `
        *,
        product:products (
          id,
          name,
          slug,
          price,
          description,
          inventory_count,
          product_images (
            id,
            image_url,
            alt_text,
            display_order
          )
        )
      `
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching cart:", error);
      return NextResponse.json(
        { error: "Failed to fetch cart" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in cart API:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { productId, quantity } = await request.json();

    // Check if item already exists in cart
    const { data: existingItem } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (existingItem) {
      // Update quantity
      const { data, error } = await supabaseAdmin
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update cart" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } else {
      // Insert new item
      const { data, error } = await supabaseAdmin
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to add to cart" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error("Error in cart API:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove from cart" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in cart API:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
