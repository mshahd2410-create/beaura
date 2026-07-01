import { Resend } from "resend";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  return new Resend(apiKey);
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailParams) {
  const resend = getResendClient();

  const from = process.env.EMAIL_FROM || "Beaura <hello@beauraegypt.com>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message || "Failed to send email");
  }

  return data;
}