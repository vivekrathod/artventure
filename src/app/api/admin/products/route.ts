import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
          display_order
        ),
        category:categories (
          id,
          name,
          slug
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
      category_id,
      inventory_count,
      weight_oz,
      materials,
      dimensions,
      care_instructions,
      is_published,
      featured,
    } = body;

    // Generate slug from name
    const slug = generateSlug(name);

    const { data, error } = await supabaseAdmin
      .from("products")
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert({
        name,
        slug,
        description,
        price,
        category_id,
        inventory_count: inventory_count || 0,
        weight_oz,
        materials,
        dimensions,
        care_instructions,
        is_published: is_published || false,
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
