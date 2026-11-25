import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { bookingRequestCreatedTemplate } from "@/lib/emailTemplates";
import { requireAuthenticatedSupabase } from "@/lib/requireAuthenticatedSupabase";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;

    const body = await request.json().catch(() => null);
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await auth.supabase
      .from("bookings")
      .select("id, bride_id, mua_id, booking_date, booking_time, location, total_price, status, service_id")
      .eq("id", bookingId)
      .eq("bride_id", auth.user.id)
      .maybeSingle();

    if (bookingError) {
      console.error("Booking email lookup failed:", bookingError);
      return NextResponse.json({ error: "Could not verify this booking." }, { status: 500 });
    }
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (String(booking.status || "").toLowerCase() !== "pending") {
      return NextResponse.json({ error: "This booking is no longer awaiting an artist response." }, { status: 409 });
    }

    const [contactsResult, muaResult, serviceResult] = await Promise.all([
      auth.supabase.rpc("get_booking_notification_contacts", { p_booking_id: bookingId }),
      auth.supabase.from("mua_profiles").select("first_name,last_name").eq("id", booking.mua_id).maybeSingle(),
      booking.service_id
        ? auth.supabase.from("mua_services").select("name").eq("id", booking.service_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (contactsResult.error || muaResult.error || serviceResult.error) {
      return NextResponse.json({ error: "Could not load booking details." }, { status: 500 });
    }
    const contacts = contactsResult.data?.[0];
    if (!contacts?.mua_email) {
      return NextResponse.json({ error: "The artist has no email address on file." }, { status: 409 });
    }

    const brideName = [contacts.bride_first_name, contacts.bride_last_name].filter(Boolean).join(" ") || "A bride";
    const muaName = [muaResult.data?.first_name, muaResult.data?.last_name].filter(Boolean).join(" ") || "artist";
    const serviceName = serviceResult.data?.name || "Makeup service";

    const data = await sendEmail({
      to: contacts.mua_email,
      subject: "New booking request on Beaura",
      html: bookingRequestCreatedTemplate({
        brideName,
        muaName,
        serviceName,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        location: booking.location,
        totalPrice: Number(booking.total_price || 0),
      }),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Booking request email error:", error);
    return NextResponse.json({ error: "Failed to send booking request email." }, { status: 500 });
  }
}
