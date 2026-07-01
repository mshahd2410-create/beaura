import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { bookingRequestCreatedTemplate } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      muaEmail,
      brideName,
      muaName,
      serviceName,
      bookingDate,
      bookingTime,
      location,
      totalPrice,
    } = body;

    if (!muaEmail) {
      return NextResponse.json(
        { error: "Missing MUA email" },
        { status: 400 }
      );
    }

    const data = await sendEmail({
      to: muaEmail,
      subject: "New booking request on Beaura",
      html: bookingRequestCreatedTemplate({
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
    console.error("Booking request email error:", error);

    return NextResponse.json(
      { error: "Failed to send booking request email" },
      { status: 500 }
    );
  }
}