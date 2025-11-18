import { Resend } from "resend";
import { OrderWithItems } from "@/types/database";

// Allow build to proceed without Resend configured
// The actual runtime will fail if RESEND_API_KEY is not set when called
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build');

// Use onboarding email for testing, or your verified domain
// Change to your verified domain once you have one: "ArtVenture <orders@yourdomain.com>"
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

// ============================================================================
// ORDER CONFIRMATION EMAIL
// ============================================================================
export async function sendOrderConfirmation(order: OrderWithItems) {
  // Skip if Resend is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping order confirmation email');
    return;
  }

  const itemsHtml = order.order_items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product_name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.price_at_purchase.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: #be123c; margin: 0; font-size: 32px; font-family: serif;">ArtVenture</h1>
    <p style="color: #666; margin: 10px 0 0;">Handcrafted with Love</p>
  </div>

  <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #be123c; margin-top: 0;">Thank You for Your Order!</h2>

    <p>Hi ${order.shipping_address.full_name},</p>

    <p>We've received your order and we're getting started on it right away. You'll receive another email when your order ships.</p>

    <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order Number:</strong> ${order.order_number}</p>
      <p style="margin: 5px 0 0;"><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
    </div>

    <h3 style="color: #333; border-bottom: 2px solid #be123c; padding-bottom: 10px;">Order Details</h3>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="text-align: right; margin-top: 20px;">
      <p style="margin: 5px 0;">Subtotal: $${(order.total_amount - order.shipping_cost - order.tax_amount).toFixed(2)}</p>
      <p style="margin: 5px 0;">Shipping: $${order.shipping_cost.toFixed(2)}</p>
      <p style="margin: 5px 0;">Tax: $${order.tax_amount.toFixed(2)}</p>
      <p style="margin: 10px 0 0; font-size: 18px; font-weight: bold; color: #be123c;">
        Total: $${order.total_amount.toFixed(2)}
      </p>
    </div>

    <h3 style="color: #333; border-bottom: 2px solid #be123c; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
    <p style="margin: 10px 0;">
      ${order.shipping_address.full_name}<br>
      ${order.shipping_address.address_line1}<br>
      ${order.shipping_address.address_line2 ? `${order.shipping_address.address_line2}<br>` : ""}
      ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}<br>
      ${order.shipping_address.country}
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
    <p>Need help? Contact us at <a href="mailto:support@artventure.com" style="color: #be123c;">support@artventure.com</a></p>
    <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ArtVenture. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Order Confirmation #${order.order_number}`,
      html,
    });

    console.log("Email sent successfully:", {
      emailId: result.data?.id,
      to: order.email,
      from: FROM_EMAIL
    });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error; // Re-throw so webhook handler logs it
  }
}

// ============================================================================
// ORDER PROCESSING EMAIL
// ============================================================================
export async function sendOrderProcessing(order: OrderWithItems) {
  // Skip if Resend is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping order processing email');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: #be123c; margin: 0; font-size: 32px; font-family: serif;">ArtVenture</h1>
  </div>

  <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #be123c; margin-top: 0;">Your Order is Being Processed!</h2>

    <p>Hi ${order.shipping_address.full_name},</p>

    <p>Great news! We're now processing your order and carefully handcrafting your jewelry pieces.</p>

    <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order Number:</strong> ${order.order_number}</p>
      <p style="margin: 5px 0 0;"><strong>Status:</strong> Processing</p>
    </div>

    <p>You'll receive another email with tracking information once your order ships.</p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
    <p>Need help? Contact us at <a href="mailto:support@artventure.com" style="color: #be123c;">support@artventure.com</a></p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Order #${order.order_number} is Being Processed`,
      html,
    });
  } catch (error) {
    console.error("Error sending order processing email:", error);
  }
}

// ============================================================================
// ORDER SHIPPED EMAIL
// ============================================================================
export async function sendOrderShipped(order: OrderWithItems) {
  // Skip if Resend is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping order shipped email');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: #be123c; margin: 0; font-size: 32px; font-family: serif;">ArtVenture</h1>
  </div>

  <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #be123c; margin-top: 0;">Your Order Has Shipped! 📦</h2>

    <p>Hi ${order.shipping_address.full_name},</p>

    <p>Exciting news! Your order is on its way to you.</p>

    <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order Number:</strong> ${order.order_number}</p>
      <p style="margin: 5px 0 0;"><strong>Tracking Number:</strong> ${order.tracking_number || "Will be updated soon"}</p>
    </div>

    ${
      order.tracking_number
        ? `<p><a href="https://www.google.com/search?q=${order.tracking_number}" style="display: inline-block; background: #be123c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Track Your Package</a></p>`
        : ""
    }

    <p style="margin-top: 20px;">Your jewelry will arrive at:</p>
    <p style="background: #f9fafb; padding: 15px; border-radius: 6px;">
      ${order.shipping_address.full_name}<br>
      ${order.shipping_address.address_line1}<br>
      ${order.shipping_address.address_line2 ? `${order.shipping_address.address_line2}<br>` : ""}
      ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}<br>
      ${order.shipping_address.country}
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
    <p>Need help? Contact us at <a href="mailto:support@artventure.com" style="color: #be123c;">support@artventure.com</a></p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Order #${order.order_number} Has Shipped!`,
      html,
    });
  } catch (error) {
    console.error("Error sending order shipped email:", error);
  }
}

// ============================================================================
// CONTACT FORM EMAIL
// ============================================================================
export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  // Fail if Resend is not configured (contact form should not proceed)
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Email service not configured');
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>New Contact Form Submission</h2>
  <p><strong>From:</strong> ${data.name} (${data.email})</p>
  <p><strong>Subject:</strong> ${data.subject}</p>
  <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 20px;">
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, "<br>")}</p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "support@artventure.com", // Your support email
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      html,
    });
  } catch (error) {
    console.error("Error sending contact form email:", error);
    throw error;
  }
}
