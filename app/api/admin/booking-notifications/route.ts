import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { bookingStatusUpdateTemplate } from "@/lib/emailTemplates";
import { getBookingNumber } from "@/lib/bookingNumber";

type EventType = "confirmed" | "cancelled" | "whatsapp_confirmation";

function normalizeWhatsAppNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  // Bride phone numbers are commonly stored in Egyptian local format (01xxxxxxxxx).
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = `20${digits.slice(1)}`;
  }
  return digits;
}

async function sendBrideWhatsAppConfirmation({
  phone,
  brideName,
  bookingDate,
  serviceName,
  confirmationNumber,
}: {
  phone: string;
  brideName: string;
  bookingDate: string;
  serviceName: string;
  confirmationNumber: string;
}) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp is not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.");
  }

  const to = normalizeWhatsAppNumber(phone);
  if (!to || to.length < 10) {
    throw new Error("Bride WhatsApp number is missing or invalid.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: "beaura_bride",
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: brideName },
                { type: "text", text: bookingDate },
                { type: "text", text: serviceName },
                { type: "text", text: confirmationNumber },
              ],
            },
          ],
        },
      }),
    }
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiError = result?.error || {};
    const message = apiError.message || "WhatsApp Cloud API rejected the message.";
    const diagnostic = [
      apiError.error_data?.details ? `details: ${apiError.error_data.details}` : null,
      apiError.code ? `code ${apiError.code}` : null,
      apiError.error_subcode ? `subcode ${apiError.error_subcode}` : null,
      apiError.type ? `type ${apiError.type}` : null,
      apiError.fbtrace_id ? `trace ${apiError.fbtrace_id}` : null,
    ].filter(Boolean).join(", ");
    console.error("WhatsApp Cloud API error:", JSON.stringify(apiError));
    throw new Error(diagnostic ? `${message} (${diagnostic})` : message);
  }

  return {
    messageId: result?.messages?.[0]?.id || null,
    status: "accepted",
  };
}

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

    if (!bookingId || !["confirmed", "cancelled", "whatsapp_confirmation"].includes(event)) {
      return NextResponse.json({ error: "Invalid booking notification request." }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, booking_reference, bride_id, mua_id, status, service_id, booking_date, booking_time, location, total_price")
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

    if ((event === "confirmed" || event === "whatsapp_confirmation") && !admin) {
      return NextResponse.json({ error: "Admin access required to send booking confirmations." }, { status: 403 });
    }
    if (event === "cancelled" && !admin && !isBookingParticipant) {
      return NextResponse.json({ error: "You cannot send notifications for this booking." }, { status: 403 });
    }

    if ((event === "confirmed" || event === "whatsapp_confirmation") && booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking is not confirmed." }, { status: 409 });
    }
    if (event === "cancelled" && !String(booking.status || "").toLowerCase().includes("cancel")) {
      return NextResponse.json({ error: "Booking is not cancelled." }, { status: 409 });
    }

    const [brideResult, muaResult, serviceResult] = await Promise.all([
      supabase.from("bride_profiles").select("first_name, last_name, email, phone").eq("id", booking.bride_id).maybeSingle(),
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
    const brideName = [bride?.first_name, bride?.last_name].filter(Boolean).join(" ") || "Bride";
    const serviceName = serviceResult.data?.name || "Makeup service";
    const bookingDate = booking.booking_date
      ? new Date(`${booking.booking_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "Not provided";
    const bookingTime = booking.booking_time
      ? new Date(`1970-01-01T${booking.booking_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      : "Not provided";
    const details = [
      {
        email: bride?.email,
        recipientName: brideName,
        otherPartyName: [mua?.first_name, mua?.last_name].filter(Boolean).join(" ") || "Makeup artist",
      },
      {
        email: mua?.email,
        recipientName: [mua?.first_name, mua?.last_name].filter(Boolean).join(" ") || "Makeup artist",
        otherPartyName: brideName,
      },
    ];

    const results = event === "whatsapp_confirmation" ? [] : await Promise.all(details.map(async (recipient) => {
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

    let whatsapp: { success: boolean; messageId?: string | null; error?: string } | null = null;
    if (event === "confirmed" || event === "whatsapp_confirmation") {
      try {
        if (!bride?.phone) throw new Error("Bride phone number is missing from her profile.");
        const result = await sendBrideWhatsAppConfirmation({
          phone: bride.phone,
          brideName,
          bookingDate,
          serviceName,
          confirmationNumber: getBookingNumber(booking.booking_reference),
        });
        whatsapp = { success: true, messageId: result.messageId };
      } catch (error) {
        whatsapp = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
        console.error("Bride WhatsApp confirmation failed:", whatsapp.error);
      }
    }

    const failed = results.filter((result) => !result.success);
    return NextResponse.json(
      { success: failed.length === 0, results, failed, whatsapp },
      { status: failed.length ? 207 : 200 }
    );
  } catch (error) {
    console.error("Admin booking notification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send booking notifications." },
      { status: 500 }
    );
  }
}
