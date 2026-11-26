import { checkPayment, jobIdOf, validSignature } from "@/lib/paystack";
import { recordPaystackPayment } from "@/lib/broker";

/**
 * Paystack calls this when a payment succeeds, even if the client closes the page before
 * coming back. Set it in Paystack: Settings → API Keys & Webhooks → Webhook URL:
 * https://<your site>/api/paystack/webhook
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("Bad signature", { status: 401 });
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      const tx = await checkPayment(event.data.reference);
      await recordPaystackPayment(jobIdOf(tx), tx);
    } catch (e) {
      console.error("[findMe] Paystack webhook failed:", e);
      return new Response("Try again", { status: 500 });
    }
  }
  return new Response("ok");
}
