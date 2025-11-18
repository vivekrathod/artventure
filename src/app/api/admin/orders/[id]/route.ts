import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { sendOrderProcessing, sendOrderShipped } from "@/lib/resend";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, tracking_number } = body;

    // Get current order before update
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", id)
      .single();

    // Update order
    const updateData: any = { status };
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      // @ts-expect-error - Supabase type inference issue with generated types
      .update(updateData)
      .eq("id", id)
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
      .single();

    if (error) {
      console.error("Error updating order:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    // Send email notifications based on status change
    const oldStatus = (currentOrder as any)?.status;
    if (data && oldStatus !== status) {
      try {
        if (status === "processing") {
          await sendOrderProcessing(data);
        } else if (status === "shipped") {
          await sendOrderShipped(data);
        }
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
