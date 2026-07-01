type DetailItem = {
  label: string;
  value: string | number | null | undefined;
};

type BeauraEmailInput = {
  title: string;
  eyebrow?: string;
  previewText?: string;
  greeting?: string;
  message: string;
  details?: DetailItem[];
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
};

const colors = {
  page: "#FAF8FF",
  card: "#FFFFFF",
  soft: "#fffafc",
  softSelected: "#f7efff",
  softPanel: "#f3f0f5",
  border: "#eadff5",
  text: "#171018",
  muted: "#6f6077",
  label: "#8a7d91",
  accent: "#171018",
  accentSoft: "#efe7f6",
};

function clean(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function detailsBlock(details: DetailItem[]) {
  const filtered = details.filter((item) => clean(item.value));

  if (filtered.length === 0) return "";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 4px; background:${colors.soft}; border:1px solid ${colors.border}; border-radius:24px; padding:10px 18px;">
      ${filtered
        .map(
          (item, index) => `
          <tr>
            <td style="padding:13px 0; ${
              index !== filtered.length - 1
                ? `border-bottom:1px solid ${colors.border};`
                : ""
            } color:${colors.label}; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:0.08em; text-transform:uppercase;">
              ${item.label}
            </td>

            <td align="right" style="padding:13px 0; ${
              index !== filtered.length - 1
                ? `border-bottom:1px solid ${colors.border};`
                : ""
            } color:${colors.text}; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:600;">
              ${clean(item.value)}
            </td>
          </tr>
        `
        )
        .join("")}
    </table>
  `;
}

export function beauraEmailTemplate({
  title,
  eyebrow = "Beaura",
  previewText,
  greeting = "Hi beautiful,",
  message,
  details = [],
  buttonText,
  buttonUrl,
  footerNote,
}: BeauraEmailInput) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>

  <body style="margin:0; padding:0; background:${colors.page}; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      ${previewText || title}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${colors.page}; padding:38px 14px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">
            <tr>
              <td align="center" style="padding:10px 0 28px;">
                <div style="display:inline-block; background:${colors.card}; border:1px solid ${colors.border}; border-radius:999px; padding:12px 24px; box-shadow:0 16px 35px rgba(23,16,24,0.06);">
                  <div style="font-size:31px; line-height:1; font-weight:500; letter-spacing:-1px; color:${colors.text};">
                    Beaura
                  </div>
                </div>

                <div style="margin-top:14px; color:${colors.muted}; font-size:12px; line-height:1.6; letter-spacing:0.18em; text-transform:uppercase;">
                  Beauty bookings made softer
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:${colors.card}; border:1px solid ${colors.border}; border-radius:34px; padding:36px 30px; box-shadow:0 22px 55px rgba(23,16,24,0.08);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="display:inline-block; margin-bottom:18px; padding:8px 14px; border-radius:999px; background:${colors.softSelected}; color:${colors.text}; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase;">
                        ${eyebrow}
                      </div>
                    </td>
                  </tr>
                </table>

                <h1 style="margin:0 0 18px; color:${colors.text}; font-size:32px; line-height:1.05; font-weight:400; letter-spacing:-1.4px;">
                  ${title}
                </h1>

                <p style="margin:0 0 12px; color:${colors.text}; font-size:15px; line-height:1.8;">
                  ${greeting}
                </p>

                <p style="margin:0; color:${colors.muted}; font-size:15px; line-height:1.85;">
                  ${message}
                </p>

                ${detailsBlock(details)}

                ${
                  buttonText && buttonUrl
                    ? `
                    <div style="margin:30px 0 8px;">
                      <a href="${buttonUrl}" style="display:inline-block; background:${colors.accent}; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:999px; font-size:14px; font-weight:600; box-shadow:0 14px 28px rgba(23,16,24,0.14);">
                        ${buttonText}
                      </a>
                    </div>
                  `
                    : ""
                }

                <div style="margin:28px 0 0; background:${colors.softPanel}; border:1px solid ${colors.border}; border-radius:22px; padding:16px 18px;">
                  <p style="margin:0; color:${colors.muted}; font-size:13px; line-height:1.75;">
                    ${
                      footerNote ||
                      "Please keep all booking communication on Beaura so your booking, guarantee, and support stay protected."
                    }
                  </p>
                </div>

                <div style="height:1px; background:${colors.border}; margin:30px 0;"></div>

                <p style="margin:0; color:${colors.text}; font-size:14px; line-height:1.75;">
                  With love,<br />
                  <strong>The Beaura Team</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 14px 0; color:${colors.label}; font-size:12px; line-height:1.7;">
                You’re receiving this email because you use Beaura.<br />
                © Beaura
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

export function newBookingMuaEmail(input: {
  muaName?: string | null;
  brideName?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  serviceName?: string | null;
  location?: string | null;
  totalPrice?: number | null;
}) {
  return beauraEmailTemplate({
    eyebrow: "New booking request",
    title: "A new glam request is waiting.",
    previewText: "A bride requested a booking with you on Beaura.",
    greeting: `Hi ${input.muaName || "artist"},`,
    message: `${
      input.brideName || "A bride"
    } sent you a new booking request. Review the details and accept or decline it from your dashboard before payment is taken.`,
    details: [
      { label: "Bride", value: input.brideName || "Bride" },
      { label: "Service", value: input.serviceName || "Makeup service" },
      { label: "Date", value: input.bookingDate },
      { label: "Time", value: input.bookingTime },
      { label: "Location", value: input.location },
      {
        label: "Total",
        value: input.totalPrice ? `EGP ${input.totalPrice}` : null,
      },
    ],
    buttonText: "Open dashboard",
    buttonUrl: "https://beauraegypt.com",
    footerNote:
      "Please respond from your Beaura dashboard so the bride can receive the correct booking update.",
  });
}

export function bookingRequestCreatedBrideEmail(input: {
  brideName?: string | null;
  muaName?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  serviceName?: string | null;
  location?: string | null;
  totalPrice?: number | null;
}) {
  return beauraEmailTemplate({
    eyebrow: "Request sent",
    title: "Your glam request was sent.",
    previewText: "Your makeup artist will confirm or decline soon.",
    greeting: `Hi ${input.brideName || "beautiful"},`,
    message: `Your booking request was sent to ${
      input.muaName || "your makeup artist"
    }. Payment will only be taken after the artist confirms your booking.`,
    details: [
      { label: "Makeup artist", value: input.muaName || "Makeup artist" },
      { label: "Service", value: input.serviceName || "Makeup service" },
      { label: "Date", value: input.bookingDate },
      { label: "Time", value: input.bookingTime },
      { label: "Location", value: input.location },
      {
        label: "Total",
        value: input.totalPrice ? `EGP ${input.totalPrice}` : null,
      },
    ],
    buttonText: "View my bookings",
    buttonUrl: "https://beauraegypt.com",
    footerNote:
      "Your request is pending. The artist will confirm or decline before any payment is taken.",
  });
}

export function bookingConfirmedBrideEmail(input: {
  brideName?: string | null;
  muaName?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  serviceName?: string | null;
  location?: string | null;
  totalPrice?: number | null;
}) {
  return beauraEmailTemplate({
    eyebrow: "Booking confirmed",
    title: "Your glam time is confirmed.",
    previewText: "Your makeup artist confirmed your Beaura booking.",
    greeting: `Hi ${input.brideName || "beautiful"},`,
    message: `${
      input.muaName || "Your makeup artist"
    } confirmed your booking. You’re officially one step closer to your perfect glam moment.`,
    details: [
      { label: "Makeup artist", value: input.muaName || "Makeup artist" },
      { label: "Service", value: input.serviceName || "Makeup service" },
      { label: "Date", value: input.bookingDate },
      { label: "Time", value: input.bookingTime },
      { label: "Location", value: input.location },
      {
        label: "Total",
        value: input.totalPrice ? `EGP ${input.totalPrice}` : null,
      },
    ],
    buttonText: "View booking",
    buttonUrl: "https://beauraegypt.com",
    footerNote:
      "Please keep all communication on Beaura so your guarantee and support stay protected.",
  });
}

export function bookingCancelledEmail(input: {
  name?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  serviceName?: string | null;
}) {
  return beauraEmailTemplate({
    eyebrow: "Booking update",
    title: "This booking was cancelled.",
    previewText: "A Beaura booking has been cancelled.",
    greeting: `Hi ${input.name || "there"},`,
    message:
      "This booking has been cancelled. If a refund or wallet update is needed, Beaura will update you separately.",
    details: [
      { label: "Service", value: input.serviceName || "Makeup service" },
      { label: "Date", value: input.bookingDate },
      { label: "Time", value: input.bookingTime },
    ],
    buttonText: "Open Beaura",
    buttonUrl: "https://beauraegypt.com",
  });
}