type BookingEmailData = {
  brideName?: string | null;
  muaName?: string | null;
  serviceName?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  location?: string | null;
  totalPrice?: number | null;
};

function safe(value: string | number | null | undefined) {
  return value === null || value === undefined || value === ""
    ? "Not provided"
    : String(value);
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not provided";
  return `EGP ${value.toLocaleString("en-EG")}`;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:12px 0; color:#8B6F61; font-size:14px; border-bottom:1px solid #F0E4DA;">
        ${label}
      </td>
      <td style="padding:12px 0; color:#3A2A24; font-size:14px; font-weight:600; text-align:right; border-bottom:1px solid #F0E4DA;">
        ${value}
      </td>
    </tr>
  `;
}

function beauraEmailLayout(title: string, subtitle: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>

      <body style="margin:0; padding:0; background:#F8F1EB; font-family:Arial, Helvetica, sans-serif;">
        <div style="width:100%; background:#F8F1EB; padding:32px 14px;">
          <div style="max-width:620px; margin:0 auto;">

            <div style="text-align:center; padding:20px 0 26px;">
              <div style="display:inline-block; background:#FFF8F3; border:1px solid #E9D6C9; border-radius:999px; padding:10px 24px;">
                <span style="font-size:25px; letter-spacing:1px; color:#6F4E43; font-weight:700;">
                  Beaura
                </span>
              </div>

              <p style="margin:12px 0 0; color:#A07E70; font-size:13px; letter-spacing:0.4px;">
                Book your perfect makeup artist
              </p>
            </div>

            <div style="background:#FFFDFC; border-radius:28px; overflow:hidden; border:1px solid #EAD8CD; box-shadow:0 16px 40px rgba(94, 63, 50, 0.10);">
              
              <div style="background:linear-gradient(135deg, #F2D7CC 0%, #FFF4EC 45%, #D9B8A8 100%); padding:34px 30px; text-align:center;">
                <div style="width:56px; height:56px; border-radius:50%; background:#FFFDFC; margin:0 auto 16px; line-height:56px; font-size:26px;">
                  ✨
                </div>

                <h1 style="margin:0; color:#3A2A24; font-size:28px; line-height:1.25; font-weight:700;">
                  ${title}
                </h1>

                <p style="margin:12px 0 0; color:#6F4E43; font-size:15px; line-height:1.6;">
                  ${subtitle}
                </p>
              </div>

              <div style="padding:30px;">
                ${content}

                <div style="margin-top:28px; background:#FBF3ED; border:1px solid #EEDFD5; border-radius:20px; padding:18px;">
                  <p style="margin:0; color:#7C6257; font-size:13px; line-height:1.7;">
                    Need help? Beaura support is here to keep your booking safe, organized, and stress-free.
                  </p>
                </div>
              </div>
            </div>

            <div style="text-align:center; padding:24px 12px 0;">
              <p style="margin:0; color:#A9897C; font-size:12px; line-height:1.7;">
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
    "This is a test email from your verified Beaura domain.",
    `
      <p style="margin:0 0 16px; color:#4D3830; font-size:15px; line-height:1.8;">
        Hi beautiful,
      </p>

      <p style="margin:0 0 16px; color:#4D3830; font-size:15px; line-height:1.8;">
        Your Beaura email setup is working successfully. Emails can now be sent from your verified domain using Resend.
      </p>

      <div style="margin-top:24px; text-align:center;">
        <span style="display:inline-block; background:#6F4E43; color:#FFFDFC; padding:13px 24px; border-radius:999px; font-size:14px; font-weight:700;">
          Beaura is glowing ✨
        </span>
      </div>
    `
  );
}

export function bookingRequestCreatedTemplate(data: BookingEmailData) {
  return beauraEmailLayout(
    "New booking request",
    "A bride just requested to book your makeup service.",
    `
      <p style="margin:0 0 16px; color:#4D3830; font-size:15px; line-height:1.8;">
        Hello ${safe(data.muaName)},
      </p>

      <p style="margin:0 0 22px; color:#4D3830; font-size:15px; line-height:1.8;">
        You received a new booking request on Beaura. Please review the details and respond from your dashboard.
      </p>

      <table style="width:100%; border-collapse:collapse; background:#FFF8F3; border-radius:18px; overflow:hidden;">
        <tbody>
          ${detailRow("Bride", safe(data.brideName))}
          ${detailRow("Service", safe(data.serviceName))}
          ${detailRow("Date", safe(data.bookingDate))}
          ${detailRow("Time", safe(data.bookingTime))}
          ${detailRow("Location", safe(data.location))}
          ${detailRow("Total", money(data.totalPrice))}
        </tbody>
      </table>

      <div style="margin-top:26px; text-align:center;">
        <span style="display:inline-block; background:#6F4E43; color:#FFFDFC; padding:13px 24px; border-radius:999px; font-size:14px; font-weight:700;">
          Open Beaura dashboard
        </span>
      </div>
    `
  );
}

export function newBookingTemplate(data: BookingEmailData) {
  return beauraEmailLayout(
    "Your booking request was sent",
    "We sent your request to the makeup artist. Now we wait for her response.",
    `
      <p style="margin:0 0 16px; color:#4D3830; font-size:15px; line-height:1.8;">
        Hello ${safe(data.brideName)},
      </p>

      <p style="margin:0 0 22px; color:#4D3830; font-size:15px; line-height:1.8;">
        Your booking request has been created successfully. The makeup artist will confirm, decline, or suggest a reschedule.
      </p>

      <table style="width:100%; border-collapse:collapse; background:#FFF8F3; border-radius:18px; overflow:hidden;">
        <tbody>
          ${detailRow("Makeup artist", safe(data.muaName))}
          ${detailRow("Service", safe(data.serviceName))}
          ${detailRow("Date", safe(data.bookingDate))}
          ${detailRow("Time", safe(data.bookingTime))}
          ${detailRow("Location", safe(data.location))}
          ${detailRow("Total", money(data.totalPrice))}
        </tbody>
      </table>

      <div style="margin-top:26px; text-align:center;">
        <span style="display:inline-block; background:#6F4E43; color:#FFFDFC; padding:13px 24px; border-radius:999px; font-size:14px; font-weight:700;">
          View my booking
        </span>
      </div>
    `
  );
}