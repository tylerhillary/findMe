import "server-only";

export type Channel = "whatsapp" | "sms";

/**
 * Sends a text through Termii (https://termii.com), a Nigerian messaging provider.
 *
 * Environment:
 *   TERMII_API_KEY    – from your Termii dashboard
 *   TERMII_SENDER_ID  – your approved sender ID (SMS) / WhatsApp sender
 *   TERMII_BASE_URL   – your account's API base URL from the dashboard (default https://api.ng.termii.com)
 *
 * Without TERMII_API_KEY, local development prints the message to the server log so the flow can
 * be tested; in production it reports that sending isn't set up.
 */
export async function sendTermii(toE164: string, text: string, channel: Channel): Promise<{ ok: boolean; dev?: boolean; error?: string }> {
  const key = process.env.TERMII_API_KEY;
  const from = process.env.TERMII_SENDER_ID;
  const base = (process.env.TERMII_BASE_URL || "https://api.ng.termii.com").replace(/\/$/, "");

  if (!key || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[termii] not configured — development only, ${channel} to ${toE164.slice(0, 7)}•••: ${text}`);
      return { ok: true, dev: true };
    }
    return { ok: false, error: "Phone verification isn't set up yet. Please try again later." };
  }

  try {
    const res = await fetch(`${base}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        to: toE164.replace(/^\+/, ""), // Termii wants 234XXXXXXXXXX
        from,
        sms: text,
        type: "plain",
        // "dnd" reaches numbers on Do-Not-Disturb, which most Nigerian lines are.
        channel: channel === "whatsapp" ? "whatsapp" : "dnd",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    if (!res.ok || (data.code && data.code !== "ok")) {
      console.error(`[termii] ${channel} send failed (${res.status}):`, data);
      return { ok: false, error: channel === "whatsapp" ? "We couldn't reach that number on WhatsApp. Try SMS instead." : "We couldn't send the SMS. Please try again." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[termii] request failed", e);
    return { ok: false, error: "We couldn't send the code right now. Please try again." };
  }
}
