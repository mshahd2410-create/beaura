type BookingEmailData = {
  brideName?: string | null;
  muaName?: string | null;
  serviceName?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  location?: string | null;
  totalPrice?: number | null;
};

type GenericEmailData = {
  title?: string;
  subtitle?: string;
  body?: string;
};

function escapeHtml(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not provided";
  return `EGP ${value.toLocaleString("en-EG")}`;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:14px 0; color:#8a7d91; font-size:13px; border-bottom:1px solid #eadff5;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:14px 0; color:#171018; font-size:14px; font-weight:700; text-align:right; border-bottom:1px solid #eadff5;">
        ${value}
      </td>
    </tr>
  `;
}

function detailsTable(rows: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; background:#fffafc; border:1px solid #eadff5; border-radius:20px; overflow:hidden;">
      <tbody>
        <tr>
          <td style="padding:4px 22px 6px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
              <tbody>
                ${rows}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function primaryButton(label: string) {
  return `
    <div style="margin-top:28px; text-align:center;">
      <span style="display:inline-block; background:#171018; color:#FFFFFF; padding:14px 28px; border-radius:999px; font-size:14px; font-weight:700; letter-spacing:0.2px;">
        ${escapeHtml(label)}
      </span>
    </div>
  `;
}

function beauraEmailLayout(title: string, subtitle: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>

      <body style="margin:0; padding:0; background:#FAF8FF; font-family:Arial, Helvetica, sans-serif;">
        <div style="width:100%; background:#FAF8FF; padding:38px 14px;">
          <div style="max-width:640px; margin:0 auto;">

            <!-- Brand header -->
            <div style="text-align:center; padding:10px 0 30px;">
              <div style="display:inline-block; background:#FFFFFF; border:1px solid #eadff5; border-radius:999px; padding:11px 26px; box-shadow:0 12px 34px rgba(23, 16, 24, 0.06);">
                <span style="font-family:Georgia, 'Times New Roman', serif; font-size:28px; letter-spacing:0.4px; color:#171018; font-weight:700;">
                  Beaura
                </span>
              </div>

              <p style="margin:11px 0 0; color:#6f6077; font-size:13px; letter-spacing:0.3px;">
                Beauty bookings, beautifully organized
              </p>
            </div>

            <!-- Main card -->
            <div style="background:#FFFFFF; border:1px solid #eadff5; border-radius:32px; overflow:hidden; box-shadow:0 20px 50px rgba(23, 16, 24, 0.08);">

              <!-- Top soft panel -->
              <div style="background:#f7efff; padding:34px 32px 32px; text-align:center; border-bottom:1px solid #eadff5;">
                <div style="width:76px; height:2px; background:#171018; margin:0 auto 22px; border-radius:999px; opacity:0.85;"></div>

                <h1 style="margin:0; color:#171018; font-family:Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.25; font-weight:700;">
                  ${escapeHtml(title)}
                </h1>

                <p style="margin:14px auto 0; color:#6f6077; font-size:15px; line-height:1.7; max-width:470px;">
                  ${escapeHtml(subtitle)}
                </p>
              </div>

              <!-- Content -->
              <div style="padding:32px;">
                ${content}

                <div style="margin-top:30px; background:#f3f0f5; border:1px solid #eadff5; border-radius:22px; padding:18px 20px;">
                  <p style="margin:0; color:#6f6077; font-size:13px; line-height:1.75;">
                    Beaura keeps your beauty booking clear, protected, and easy to manage from start to finish.
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align:center; padding:24px 12px 0;">
              <p style="margin:0; color:#8a7d91; font-size:12px; line-height:1.8;">
                You received this email because you used Beaura.
                <br />
                © ${new Date().getFullYear()} Beaura. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
}

export function testEmailTemplate() {
  return beauraEmailLayout(
    "Your Beaura email is ready",
    "Your verified Beaura domain is now connected and ready to send emails.",
    `
      <p style="margin:0 0 16px; color:#171018; font-size:15px; line-height:1.8;">
        Hello,
      </p>

      <p style="margin:0 0 18px; color:#6f6077; font-size:15px; line-height:1.8;">
        This is a test email from Beaura. Your Resend setup is working, and emails can now be sent from your verified domain.
      </p>

      ${primaryButton("Email setup confirmed")}
    `
  );
}

export function bookingRequestCreatedTemplate(data: BookingEmailData) {
  return beauraEmailLayout(
    "New booking request",
    "A bride has requested to book your makeup service through Beaura.",
    `
      <p style="margin:0 0 16px; color:#171018; font-size:15px; line-height:1.8;">
        Hello ${escapeHtml(data.muaName)},
      </p>

      <p style="margin:0 0 22px; color:#6f6077; font-size:15px; line-height:1.8;">
        You received a new booking request. Please review the details below and respond from your Beaura dashboard.
      </p>

      ${detailsTable(`
        ${detailRow("Bride", escapeHtml(data.brideName))}
        ${detailRow("Service", escapeHtml(data.serviceName))}
        ${detailRow("Date", escapeHtml(data.bookingDate))}
        ${detailRow("Time", escapeHtml(data.bookingTime))}
        ${detailRow("Location", escapeHtml(data.location))}
        ${detailRow("Total", escapeHtml(money(data.totalPrice)))}
      `)}

      ${primaryButton("Open Beaura dashboard")}
    `
  );
}

export function newBookingTemplate(data: BookingEmailData) {
  return beauraEmailLayout(
    "Your booking request was sent",
    "We sent your request to the makeup artist. You will receive an update once she responds.",
    `
      <p style="margin:0 0 16px; color:#171018; font-size:15px; line-height:1.8;">
        Hello ${escapeHtml(data.brideName)},
      </p>

      <p style="margin:0 0 22px; color:#6f6077; font-size:15px; line-height:1.8;">
        Your booking request has been created successfully. The makeup artist can confirm, decline, or suggest a reschedule.
      </p>

      ${detailsTable(`
        ${detailRow("Makeup artist", escapeHtml(data.muaName))}
        ${detailRow("Service", escapeHtml(data.serviceName))}
        ${detailRow("Date", escapeHtml(data.bookingDate))}
        ${detailRow("Time", escapeHtml(data.bookingTime))}
        ${detailRow("Location", escapeHtml(data.location))}
        ${detailRow("Total", escapeHtml(money(data.totalPrice)))}
      `)}

      ${primaryButton("View my booking")}
    `
  );
}

/*
  Backward-compatible exports.
  Keep these so older Beaura files do not break if they import the previous names.
*/

export function beauraEmailTemplate(data?: GenericEmailData) {
  return beauraEmailLayout(
    data?.title || "Beaura notification",
    data?.subtitle || "You have a new update from Beaura.",
    `
      <p style="margin:0; color:#6f6077; font-size:15px; line-height:1.8;">
        ${escapeHtml(data?.body || "Please open Beaura to view the latest update.")}
      </p>
    `
  );
}

export function bookingRequestCreatedBrideEmail(data: BookingEmailData) {
  return newBookingTemplate(data);
}

export function newBookingMuaEmail(data: BookingEmailData) {
  return bookingRequestCreatedTemplate(data);
}