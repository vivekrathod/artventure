import { NextResponse } from "next/server";

export async function GET() {
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const resendKey = process.env.RESEND_API_KEY ? "✓ Configured" : "✗ Not configured";

  return NextResponse.json({
    fromEmail,
    resendKey,
    message: "Current email configuration"
  });
}
