import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { testEmailTemplate } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Missing recipient email" },
        { status: 400 }
      );
    }

    const data = await sendEmail({
      to,
      subject: "Beaura email test",
      html: testEmailTemplate(),
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Send test email error:", error);

    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}