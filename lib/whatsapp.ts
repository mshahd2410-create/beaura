import { getBookingNumber } from "@/lib/bookingNumber";

type WhatsAppTemplateName =
  | "beaura_mua_new_booking"
  | "beaura_mua_payment_verified"
  | "beaura_payment_proof_received"
  | "beaura_payment_required"
  | "beaura_quote_received"
  | "beaura_mua_booking_confirmed";

function normalizeWhatsAppNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  return digits;
}

export function formatWhatsAppDate(value: string | null | undefined) {
  if (!value) return "To be confirmed";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" });
}

export function formatWhatsAppAmount(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `EGP ${amount.toLocaleString("en-EG", { maximumFractionDigits: 2 })}`;
}

export async function sendBeauraWhatsAppTemplate({
  to,
  name,
  parameters,
}: {
  to: string;
  name: WhatsAppTemplateName;
  parameters: string[];
}) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";
  if (!accessToken || !phoneNumberId) throw new Error("WhatsApp is not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.");

  const normalized = normalizeWhatsAppNumber(to);
  if (!normalized || normalized.length < 10) throw new Error("Recipient WhatsApp number is missing or invalid.");

  const language = name === "beaura_mua_new_booking" || name === "beaura_quote_received" ? "en_US" : "en";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalized,
      type: "template",
      template: {
        name,
        language: { code: language },
        components: [{
          type: "body",
          parameters: parameters.map((text) => ({ type: "text", text: String(text || "Not provided") })),
        }],
      },
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = result?.error || {};
    throw new Error(error.message || "WhatsApp Cloud API rejected the message.");
  }
  return { messageId: result?.messages?.[0]?.id || null };
}

export { getBookingNumber };
