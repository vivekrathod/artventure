import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get("featured");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query = supabase
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
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (featured === "true") {
      query = query.eq("featured", true);
    }

    if (category) {
      query = query.eq("category_id", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in products API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
