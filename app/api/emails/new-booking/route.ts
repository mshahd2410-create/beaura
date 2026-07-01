import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { newBookingTemplate } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      brideEmail,
      brideName,
      muaName,
      serviceName,
      bookingDate,
      bookingTime,
      location,
      totalPrice,
    } = body;

    if (!brideEmail) {
      return NextResponse.json(
        { error: "Missing bride email" },
        { status: 400 }
      );
    }

    const data = await sendEmail({
      to: brideEmail,
      subject: "Your Beaura booking request was sent",
      html: newBookingTemplate({
        brideName,
        muaName,
        serviceName,
        bookingDate,
        bookingTime,
        location,
        totalPrice,
      }),
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("New booking email error:", error);

    return NextResponse.json(
      {
        error: "Failed to send new booking email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}