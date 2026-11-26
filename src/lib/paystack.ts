import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack (https://paystack.com): clients pay findMe by card, bank transfer or USSD on Paystack's
 * own checkout page. Needs PAYSTACK_SECRET_KEY (sk_test_… while testing, sk_live_… when live).
 */
const API = "https://api.paystack.co";
const key = () => process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";

export const paystackReady = () => key().startsWith("sk_");
export const paystackTestMode = () => key().startsWith("sk_test_");

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || !body.data) throw new Error(body?.message || `Paystack error ${res.status}`);
  return body.data;
}

/** Starts a payment and returns Paystack's checkout link. Amount is in naira. */
export function startPayment(p: { email: string; naira: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: p.email, amount: Math.round(p.naira * 100), currency: "NGN", reference: p.reference, callback_url: p.callbackUrl, metadata: p.metadata }),
  });
}

export type PaystackTx = { status: string; reference: string; amount: number; currency: string; metadata?: { jobId?: string } | string | null };

/** Asks Paystack directly whether a payment went through (never trust the browser's word). */
export const checkPayment = (reference: string) => call<PaystackTx>(`/transaction/verify/${encodeURIComponent(reference)}`);

/** Webhooks are signed with the secret key (HMAC SHA-512 of the raw body). */
export function validSignature(raw: string, signature: string | null) {
  if (!signature || !paystackReady()) return false;
  const want = Buffer.from(createHmac("sha512", key()).update(raw).digest("hex"));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** The job a payment belongs to: references look like "fm-<jobId>-<time>". */
export function jobIdOf(tx: PaystackTx) {
  const meta = typeof tx.metadata === "string" ? (() => { try { return JSON.parse(tx.metadata) as { jobId?: string }; } catch { return null; } })() : tx.metadata;
  return meta?.jobId || tx.reference.split("-")[1] || "";
}
