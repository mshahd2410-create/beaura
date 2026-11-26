import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBookingNumber } from "@/lib/bookingNumber";
import {
  formatWhatsAppAmount,
  formatWhatsAppDate,
  sendBeauraWhatsAppTemplate,
} from "@/lib/whatsapp";

type EventType =
  | "new_booking"
  | "quote_received"
  | "payment_required"
  | "payment_proof_received"
  | "payment_verified";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const event = body?.event as EventType;
    const allowed: EventType[] = ["new_booking", "quote_received", "payment_required", "payment_proof_received", "payment_verified"];
    if (!bookingId || !allowed.includes(event)) return NextResponse.json({ error: "Invalid WhatsApp event." }, { status: 400 });

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, booking_reference, bride_id, mua_id, status, booking_date, service_id, total_price, deposit_amount, amount_due_after_wallet, travel_fee, payment_proof_status")
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError || !booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    const isBride = booking.bride_id === user.id;
    const isMua = booking.mua_id === user.id;
    const isAdmin = Boolean(admin);

    if (event === "new_booking" && (!isBride || String(booking.status).toLowerCase() !== "pending")) {
      return NextResponse.json({ error: "Only the bride can notify the artist about a pending booking." }, { status: 403 });
    }
    if (event === "quote_received" && (!isMua || String(booking.status).toLowerCase() !== "pending")) {
      return NextResponse.json({ error: "Only the assigned artist can send a quote notification for a pending booking." }, { status: 403 });
    }
    if ((event === "payment_required" || event === "payment_proof_received") && !isBride) {
      return NextResponse.json({ error: "Only the bride can trigger this payment notification." }, { status: 403 });
    }
    if (event === "payment_verified" && !isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }
    if (event === "payment_proof_received" && String(booking.payment_proof_status || "") !== "pending_review") {
      return NextResponse.json({ error: "Payment proof is not awaiting review." }, { status: 409 });
    }
    if (event === "payment_verified" && String(booking.status || "").toLowerCase() !== "confirmed") {
      return NextResponse.json({ error: "Booking payment has not been verified and confirmed." }, { status: 409 });
    }

    const [contactsResult, serviceResult] = await Promise.all([
      supabase.rpc("get_booking_notification_contacts", { p_booking_id: bookingId }),
      booking.service_id ? supabase.from("mua_services").select("name").eq("id", booking.service_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (contactsResult.error || serviceResult.error) return NextResponse.json({ error: "Could not load booking contacts." }, { status: 500 });
    const contacts = contactsResult.data?.[0] || {};
    const brideName = [contacts.bride_first_name, contacts.bride_last_name].filter(Boolean).join(" ") || "Bride";
    const muaName = [contacts.mua_first_name, contacts.mua_last_name].filter(Boolean).join(" ") || "Makeup artist";
    const reference = getBookingNumber(booking.booking_reference);
    const date = formatWhatsAppDate(booking.booking_date);
    const service = serviceResult.data?.name || "Beauty service";
    const total = formatWhatsAppAmount(booking.total_price);
    const due = formatWhatsAppAmount(booking.amount_due_after_wallet ?? booking.deposit_amount ?? Number(booking.total_price || 0) * 0.5);

    let recipientPhone = "";
    let template: Parameters<typeof sendBeauraWhatsAppTemplate>[0]["name"];
    let parameters: string[] = [];

    switch (event) {
      case "new_booking":
        recipientPhone = contacts.mua_phone || "";
        template = "beaura_mua_new_booking";
        parameters = [muaName, brideName, date, service, reference];
        break;
      case "quote_received":
        recipientPhone = contacts.bride_phone || "";
        template = "beaura_quote_received";
        parameters = [brideName, muaName, reference, date, formatWhatsAppAmount(booking.travel_fee ?? booking.total_price)];
        break;
      case "payment_required":
        recipientPhone = contacts.bride_phone || "";
        template = "beaura_payment_required";
        parameters = [brideName, reference, due, "within 48 hours"];
        break;
      case "payment_proof_received":
        recipientPhone = contacts.bride_phone || "";
        template = "beaura_payment_proof_received";
        parameters = [brideName, reference, due];
        break;
      case "payment_verified":
        recipientPhone = contacts.mua_phone || "";
        template = "beaura_mua_payment_verified";
        parameters = [muaName, reference, brideName, due];
        break;
    }

    if (!recipientPhone) return NextResponse.json({ error: "Recipient WhatsApp number is missing from the profile." }, { status: 409 });
    const result = await sendBeauraWhatsAppTemplate({ to: recipientPhone, name: template!, parameters });
    let artistConfirmationMessageId: string | null = null;
    if (event === "payment_verified") {
      const confirmation = await sendBeauraWhatsAppTemplate({
        to: recipientPhone,
        name: "beaura_mua_booking_confirmed",
        parameters: [muaName, reference, brideName, date, service, total],
      });
      artistConfirmationMessageId = confirmation.messageId;
    }
    return NextResponse.json({ success: true, messageId: result.messageId, template, artistConfirmationMessageId });
  } catch (error) {
    console.error("Beaura WhatsApp event error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send WhatsApp notification." }, { status: 500 });
  }
}
