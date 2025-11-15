import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .select(
        `
        *,
        product:products (
          id,
          name,
          price,
          description,
          stock_quantity,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary
          )
        )
      `
      )
      .eq("clerk_user_id", userId);

    if (error) {
      console.error("Error fetching cart:", error);
      return NextResponse.json(
        { error: "Failed to fetch cart" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in cart API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    // Check if item already exists in cart
    const { data: existingItem } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("clerk_user_id", userId)
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
          clerk_user_id: userId,
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
  } catch (error) {
    console.error("Error in cart API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      .eq("clerk_user_id", userId)
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove from cart" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in cart API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
