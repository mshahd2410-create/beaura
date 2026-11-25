import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { testEmailTemplate } from "@/lib/emailTemplates";
import { requireAuthenticatedSupabase } from "@/lib/requireAuthenticatedSupabase";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;

    const { data: admin, error: adminError } = await auth.supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Admin role lookup failed:", adminError);
      return NextResponse.json({ error: "Could not verify admin access." }, { status: 503 });
    }
    if (!admin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }
    if (!auth.user.email) {
      return NextResponse.json({ error: "Your admin account has no email address." }, { status: 409 });
    }

    const data = await sendEmail({
      to: auth.user.email,
      subject: "Beaura email test",
      html: testEmailTemplate(),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send test email error:", error);
    return NextResponse.json({ error: "Failed to send test email." }, { status: 500 });
  }
}
