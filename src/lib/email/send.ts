import { Resend } from "resend";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    "Glitter Hits <noreply@glitterhits.gay>";

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (result.error) {
      throw new Error(result.error.message || "Email send failed.");
    }
    return { provider: "resend" as const, id: result.data?.id };
  }

  // Optional nodemailer-style SMTP via raw fetch is not wired;
  // require RESEND for production launches.
  if (process.env.SMTP_HOST) {
    throw new Error(
      "SMTP_HOST is set but only Resend is supported. Set RESEND_API_KEY instead.",
    );
  }

  throw new Error("Email is not configured (missing RESEND_API_KEY).");
}

export function passwordResetEmail(params: { name?: string | null; resetUrl: string }) {
  const who = params.name?.trim() || "there";
  const text = `Hi ${who},

We received a request to reset your Glitter Hits password.

Open this link within 1 hour:
${params.resetUrl}

If you did not request this, you can ignore this email.

— Glitter Hits
Surf. Spark. Share. Get Lucky.`;

  const html = `
  <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1028;max-width:560px">
    <p>Hi ${who},</p>
    <p>We received a request to reset your <strong>Glitter Hits</strong> password.</p>
    <p><a href="${params.resetUrl}" style="display:inline-block;background:#ff4fd8;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:600">Reset password</a></p>
    <p style="color:#6b5b7a;font-size:14px">This link expires in 1 hour. If you did not request it, ignore this email.</p>
    <p style="color:#6b5b7a;font-size:13px">Surf. Spark. Share. Get Lucky.</p>
  </div>`;

  return { subject: "Reset your Glitter Hits password", text, html };
}
