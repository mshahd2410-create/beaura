import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    resendApiKeyExists: Boolean(process.env.RESEND_API_KEY),
    emailFromExists: Boolean(process.env.EMAIL_FROM),
    emailFrom: process.env.EMAIL_FROM || null,
  });
}