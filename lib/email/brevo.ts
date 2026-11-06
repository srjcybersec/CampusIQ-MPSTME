/**
 * Brevo (Sendinblue) transactional email sender.
 *
 * Uses Brevo's HTTP API (v3) rather than SMTP so it works reliably on Vercel's
 * serverless runtime. Requires the following environment variables:
 *   BREVO_API_KEY    - transactional API key from Brevo (SMTP & API -> API Keys)
 *   BREVO_FROM_EMAIL - a sender on a domain authenticated in Brevo
 *   BREVO_FROM_NAME  - display name for the sender
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const DEFAULT_FROM_EMAIL = "noreply@campusiqmpstme.space";
const DEFAULT_FROM_NAME = "CampusIQ";

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendBrevoEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || DEFAULT_FROM_NAME;

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: params.to, name: params.toName || params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent || stripHtml(params.htmlContent),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo email send failed (${res.status}): ${body}`);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Builds the verification OTP email. The code is delivered as plain text so no
 * clickable link is involved (email security scanners can't "use up" a code).
 */
export function buildOtpEmail(code: string, name?: string): { subject: string; htmlContent: string; textContent: string } {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi there,";
  const subject = "Verify your CampusIQ account";

  const htmlContent = `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;max-width:520px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 12px;font-size:15px;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:15px;">Your CampusIQ verification code is:</p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px;">${code}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;">Enter this code on the signup screen. It expires in 10 minutes.</p>
    <p style="margin:0;font-size:14px;color:#444;">If you did not request this, you can ignore this email.</p>
    <p style="margin:24px 0 0;font-size:12px;color:#777;">CampusIQ · MPSTME</p>
  </div>`;

  const textContent = `${name ? `Hi ${name},` : "Hi there,"}\n\nYour CampusIQ verification code is: ${code}\n\nThis code expires in 10 minutes. Enter it on the verification screen in the app.\n\nIf you didn't request this, you can ignore this email.\n\n— CampusIQ · MPSTME`;

  return { subject, htmlContent, textContent };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
