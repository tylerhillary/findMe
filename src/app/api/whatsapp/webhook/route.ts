import { revalidateTag } from "next/cache";
import { notify } from "@/lib/notify";
import { CATALOG_TAG } from "@/lib/queries";
import type { PhoneVerificationDoc } from "@/lib/schema";
import { approveVerification, replyOnWhatsApp, validMetaSignature, verifications } from "@/lib/whatsapp";

/**
 * Meta WhatsApp Cloud API webhook — free automatic number verification.
 * In Meta's dashboard set the callback URL to https://<your-domain>/api/whatsapp/webhook,
 * the verify token to WHATSAPP_VERIFY_TOKEN, and subscribe to "messages".
 */

// Meta calls this once to confirm the webhook belongs to us.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === token) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type IncomingMessage = { from?: string; type?: string; text?: { body?: string } };
type WebhookBody = { entry?: { changes?: { value?: { messages?: IncomingMessage[] } }[] }[] };

// Incoming WhatsApp messages. Always answer 200 quickly once the signature checks out,
// otherwise Meta retries.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validMetaSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("ok", { status: 200 });
  }

  const messages = (body.entry ?? []).flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.messages ?? []);
  for (const m of messages) {
    const code = m.text?.body?.toUpperCase().match(/FM-\d{6}/)?.[0];
    const fromDigits = (m.from ?? "").replace(/\D/g, "");
    if (!code || !fromDigits) continue;

    const snap = await verifications().where("code", "==", code).limit(1).get();
    const doc = snap.docs[0];
    const v = doc?.data() as PhoneVerificationDoc | undefined;
    if (!doc || !v || v.status !== "pending") continue;
    if (Date.now() > v.expiresAt) {
      await replyOnWhatsApp(fromDigits, "That findMe code has expired. Open your findMe profile and tap Verify on WhatsApp again.");
      continue;
    }
    // The message must come from the number on the profile — that's the whole proof.
    if (v.phone.replace(/\D/g, "") !== fromDigits) {
      await replyOnWhatsApp(fromDigits, "Please send this code from the WhatsApp number on your findMe profile.");
      continue;
    }

    const res = await approveVerification(doc.id, "whatsapp");
    if (res !== "ok") continue;
    revalidateTag(CATALOG_TAG, "max"); // updateTag is only allowed in server actions
    await notify({
      userId: doc.id,
      kind: "status",
      title: "Your number is verified",
      body: "Clients now see the Verified number badge on your profile, and you rank higher in search.",
      href: `/pro/${doc.id}`,
      cta: "See your profile",
    });
    await replyOnWhatsApp(fromDigits, "✅ Your number is verified on findMe. Clients will now see the Verified badge on your profile.");
  }
  return new Response("ok", { status: 200 });
}
