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
  <div style="margin:0;padding:0;background:#0b0b0f;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;">CampusIQ <span style="color:#7C7CFF;">MPSTME</span></h1>
      </div>
      <div style="background:#141419;border:1px solid #222;border-radius:16px;padding:28px 24px;color:#D4D4D8;">
        <p style="margin:0 0 12px;font-size:15px;">${greeting}</p>
        <p style="margin:0 0 20px;font-size:15px;">Use the code below to verify your email address and finish setting up your account.</p>
        <div style="text-align:center;margin:24px 0;">
          <div style="display:inline-block;background:#0b0b0f;border:1px solid #7C7CFF;border-radius:12px;padding:16px 28px;">
            <span style="color:#ffffff;font-size:34px;font-weight:700;letter-spacing:10px;">${code}</span>
          </div>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#9a9aa5;">This code expires in 10 minutes. Enter it on the verification screen in the app.</p>
        <p style="margin:0;font-size:13px;color:#9a9aa5;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <p style="text-align:center;color:#5a5a63;font-size:12px;margin-top:20px;">© CampusIQ · MPSTME</p>
    </div>
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
