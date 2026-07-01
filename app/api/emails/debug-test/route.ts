import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    resendApiKeyExists: Boolean(process.env.re_eRVMFseY_LRs3HqmFzpQ2kMxJHutpFYz8),
    emailFromExists: Boolean(process.env.hello@beauraegypt.com),
    emailFrom: process.env.hello@beauraegypt.com || null,
  });
}