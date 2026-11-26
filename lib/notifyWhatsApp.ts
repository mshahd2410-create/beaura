import { supabase } from "@/lib/supabaseClient";

export type BeauraWhatsAppEvent =
  | "new_booking"
  | "quote_received"
  | "payment_required"
  | "payment_proof_received"
  | "payment_verified";

export async function notifyBookingWhatsApp(bookingId: string, event: BeauraWhatsAppEvent) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { success: false, error: "Session unavailable." };

    const response = await fetch("/api/whatsapp/booking-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, event }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || "WhatsApp notification could not be sent." };
    }
    return { success: true, messageId: result.messageId || null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
