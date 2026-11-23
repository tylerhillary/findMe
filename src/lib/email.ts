import "server-only";

/** Base URL used in links inside emails. Set NEXT_PUBLIC_APP_URL to your live domain when you deploy. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Sends an email through Resend (https://resend.com — free for 3,000 emails a month).
 * Needs RESEND_API_KEY and EMAIL_FROM (e.g. "findMe <alerts@yourdomain.com>") in the environment.
 * Without them it does nothing, so the app works the same with in-app notifications only.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email] skipped (RESEND_API_KEY / EMAIL_FROM not set): "${subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}

/** A simple, branded, mobile-friendly email. */
export function emailLayout({ name, title, body, href, cta }: { name: string; title: string; body: string; href: string; cta: string }) {
  const url = href.startsWith("http") ? href : `${APP_URL}${href}`;
  return `<!doctype html><html><body style="margin:0;background:#f6f5fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f0c1d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e9e6f2">
<tr><td style="padding:24px 24px 8px;font-size:20px;font-weight:800;letter-spacing:-0.3px">find<span style="color:#7c3aed">Me</span></td></tr>
<tr><td style="padding:8px 24px 0;font-size:15px;color:#4a4660">Hi ${esc(name.split(" ")[0] || "there")},</td></tr>
<tr><td style="padding:8px 24px 0;font-size:18px;font-weight:700">${esc(title)}</td></tr>
<tr><td style="padding:8px 24px 0;font-size:15px;line-height:1.55;color:#4a4660">${esc(body)}</td></tr>
<tr><td style="padding:20px 24px 24px"><a href="${esc(url)}" style="display:inline-block;background:#6230f0;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${esc(cta)}</a></td></tr>
</table>
<p style="max-width:520px;font-size:12px;color:#77738b;line-height:1.5;margin:14px auto 0">You're getting this because you have a findMe account. findMe will never ask for your password, OTP or bank PIN.</p>
</td></tr></table></body></html>`;
}
