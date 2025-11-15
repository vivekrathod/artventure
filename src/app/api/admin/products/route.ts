import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        `
        *,
        product_images (
          id,
          image_url,
          alt_text,
          is_primary,
          display_order
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      name,
      description,
      price,
      materials,
      dimensions,
      care_instructions,
      stock_quantity,
      status,
      featured,
    } = body;

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        description,
        price,
        materials,
        dimensions,
        care_instructions,
        stock_quantity: stock_quantity || 0,
        status: status || "draft",
        featured: featured || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
