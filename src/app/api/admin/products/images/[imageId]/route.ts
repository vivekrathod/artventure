import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

// Update product image (e.g., alt text)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    await requireAdmin();
    const { imageId } = await params;
    const body = await request.json();
    const { alt_text } = body;

    const { data, error } = await supabaseAdmin
      .from("product_images")
      .update({ alt_text })
      .eq("id", imageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating image:", error);
      return NextResponse.json(
        { error: "Failed to update image" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// Delete a product image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    await requireAdmin();
    const { imageId } = await params;

    // Get image info before deleting
    const { data: image } = await supabaseAdmin
      .from("product_images")
      .select("image_url")
      .eq("id", imageId)
      .single();

    // Delete from database
    const { error } = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      console.error("Error deleting image:", error);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    // Optionally delete from storage (extract filename from URL)
    if (image?.image_url) {
      const fileName = image.image_url.split("/").pop();
      if (fileName?.startsWith("product-")) {
        await supabaseAdmin.storage
          .from("product-images")
          .remove([fileName]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
