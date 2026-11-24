import "server-only";
import nodemailer from "nodemailer";

/**
 * Base URL used in links inside emails: NEXT_PUBLIC_APP_URL if set, otherwise the site's live
 * Vercel address (set automatically by Vercel), otherwise localhost for development.
 */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Sends an email. Uses whichever is configured:
 *  - Gmail: GMAIL_USER + GMAIL_APP_PASSWORD (a Google "app password", not your normal password).
 *    Free, about 500 emails a day, no domain needed.
 *  - Resend: RESEND_API_KEY + EMAIL_FROM (needs a domain you own).
 * With neither, it does nothing and the app relies on in-app notifications.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return sendWithGmail(to, subject, html);
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) return sendWithResend(to, subject, html);
  console.info(`[email] skipped (no email service configured): "${subject}"`);
  return false;
}

let gmail: nodemailer.Transporter | null = null;

async function sendWithGmail(to: string, subject: string, html: string) {
  const user = process.env.GMAIL_USER!;
  gmail ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") },
  });
  try {
    await gmail.sendMail({ from: process.env.EMAIL_FROM || `findMe <${user}>`, to, subject, html });
    return true;
  } catch (e) {
    console.error("[email] Gmail send failed:", e);
    return false;
  }
}

async function sendWithResend(to: string, subject: string, html: string) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}

export type EmailExtras = {
  /** A quoted block, e.g. the client's message. */
  quote?: { from: string; text: string };
  /** Label/value rows, e.g. budget and service. */
  details?: [string, string][];
  /** Small note under the button. */
  footnote?: string;
};

/** A simple, branded, mobile-friendly email. */
export function emailLayout({ name, title, body, href, cta, quote, details, footnote }: { name: string; title: string; body: string; href: string; cta: string } & EmailExtras) {
  const url = href.startsWith("http") ? href : `${APP_URL}${href}`;
  const quoteHtml = quote
    ? `<tr><td style="padding:16px 24px 0"><div style="border-left:3px solid #7c3aed;background:#f6f5fb;border-radius:8px;padding:12px 14px;font-size:15px;line-height:1.55;color:#0f0c1d;white-space:pre-wrap">${esc(quote.text)}</div><div style="padding-top:6px;font-size:13px;color:#77738b">from ${esc(quote.from)}</div></td></tr>`
    : "";
  const detailsHtml = details?.length
    ? `<tr><td style="padding:14px 24px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#4a4660">${details
        .map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#77738b">${esc(k)}</td><td style="padding:3px 0;font-weight:600;color:#0f0c1d">${esc(v)}</td></tr>`)
        .join("")}</table></td></tr>`
    : "";
  const footHtml = footnote ? `<tr><td style="padding:0 24px 22px;font-size:13px;color:#77738b">${esc(footnote)}</td></tr>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f5fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f0c1d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e9e6f2">
<tr><td style="padding:24px 24px 8px;font-size:20px;font-weight:800;letter-spacing:-0.3px">find<span style="color:#7c3aed">Me</span></td></tr>
<tr><td style="padding:8px 24px 0;font-size:15px;color:#4a4660">Hi ${esc(name.split(" ")[0] || "there")},</td></tr>
<tr><td style="padding:8px 24px 0;font-size:18px;font-weight:700">${esc(title)}</td></tr>
<tr><td style="padding:8px 24px 0;font-size:15px;line-height:1.55;color:#4a4660">${esc(body)}</td></tr>
${quoteHtml}${detailsHtml}
<tr><td style="padding:20px 24px ${footnote ? "12px" : "24px"}"><a href="${esc(url)}" style="display:inline-block;background:#6230f0;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${esc(cta)}</a></td></tr>
${footHtml}
</table>
<p style="max-width:520px;font-size:12px;color:#77738b;line-height:1.5;margin:14px auto 0">You're getting this because you have a findMe account. findMe will never ask for your password, OTP or bank PIN.<br>findMe is brought to you by Radius Technology.</p>
</td></tr></table></body></html>`;
}
