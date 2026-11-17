import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { bookingStatusUpdateTemplate } from "@/lib/emailTemplates";

type EventType = "confirmed" | "cancelled";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
    const event = body.event as EventType;
    const reason = typeof body.reason === "string" ? body.reason : null;

    if (!bookingId || !["confirmed", "cancelled"].includes(event)) {
      return NextResponse.json({ error: "Invalid booking notification request." }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, bride_id, mua_id, status, service_id, booking_date, booking_time, location, total_price")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: bookingError?.message || "Booking not found." }, { status: 404 });
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const isBookingParticipant = booking.bride_id === user.id || booking.mua_id === user.id;

    if (event === "confirmed" && !admin) {
      return NextResponse.json({ error: "Admin access required to email booking confirmations." }, { status: 403 });
    }
    if (event === "cancelled" && !admin && !isBookingParticipant) {
      return NextResponse.json({ error: "You cannot send notifications for this booking." }, { status: 403 });
    }

    if (event === "confirmed" && booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking is not confirmed." }, { status: 409 });
    }
    if (event === "cancelled" && !String(booking.status || "").toLowerCase().includes("cancel")) {
      return NextResponse.json({ error: "Booking is not cancelled." }, { status: 409 });
    }

    const [brideResult, muaResult, serviceResult] = await Promise.all([
      supabase.from("bride_profiles").select("first_name, last_name, email").eq("id", booking.bride_id).maybeSingle(),
      supabase.from("mua_profiles").select("first_name, last_name, email").eq("id", booking.mua_id).maybeSingle(),
      booking.service_id
        ? supabase.from("mua_services").select("name").eq("id", booking.service_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (brideResult.error || muaResult.error || serviceResult.error) {
      return NextResponse.json({ error: "Could not load booking recipient details." }, { status: 500 });
    }

    const bride = brideResult.data;
    const mua = muaResult.data;
    const serviceName = serviceResult.data?.name || "Makeup service";
    const bookingDate = booking.booking_date
      ? new Date(booking.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "Not provided";
    const bookingTime = booking.booking_time || "Not provided";
    const details = [
      {
        email: bride?.email,
        recipientName: [bride?.first_name, bride?.last_name].filter(Boolean).join(" ") || "Bride",
        otherPartyName: [mua?.first_name, mua?.last_name].filter(Boolean).join(" ") || "Makeup artist",
      },
      {
        email: mua?.email,
        recipientName: [mua?.first_name, mua?.last_name].filter(Boolean).join(" ") || "Makeup artist",
        otherPartyName: [bride?.first_name, bride?.last_name].filter(Boolean).join(" ") || "Bride",
      },
    ];

    const results = await Promise.all(details.map(async (recipient) => {
      if (!recipient.email) {
        return { recipient: recipient.recipientName, success: false, error: "Email address missing" };
      }
      try {
        await sendEmail({
          to: recipient.email,
          subject: event === "confirmed" ? "Your Beaura booking is confirmed" : "Your Beaura booking has been cancelled",
          html: bookingStatusUpdateTemplate(event, {
            recipientName: recipient.recipientName,
            otherPartyName: recipient.otherPartyName,
            serviceName,
            bookingDate,
            bookingTime,
            location: booking.location,
            totalPrice: Number(booking.total_price || 0),
            reason,
          }),
        });
        return { recipient: recipient.recipientName, success: true };
      } catch (error) {
        return {
          recipient: recipient.recipientName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }));

    const failed = results.filter((result) => !result.success);
    return NextResponse.json({ success: failed.length === 0, results, failed }, { status: failed.length ? 207 : 200 });
  } catch (error) {
    console.error("Admin booking notification email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send booking notification emails." },
      { status: 500 }
    );
  }
}
