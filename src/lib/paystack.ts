import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cacheLife } from "next/cache";

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

/* ───────────── Paying pros (Paystack Transfers) ─────────────
 * Money goes out of findMe's Paystack balance to the pro's bank account.
 * For it to send without a code each time, turn off "Confirm transfers before sending"
 * (OTP) in Paystack: Settings → Preferences → Transfers.
 */

export type PaystackBank = { name: string; code: string };

/** Nigerian banks Paystack can pay into, A–Z. */
export async function listBanks(): Promise<PaystackBank[]> {
  "use cache";
  cacheLife("days");
  const banks = await call<{ name: string; code: string; active: boolean; is_deleted?: boolean }[]>("/bank?country=nigeria&currency=NGN&perPage=200");
  const seen = new Set<string>();
  return banks
    .filter((b) => b.active && !b.is_deleted && !seen.has(b.code) && seen.add(b.code))
    .map((b) => ({ name: b.name, code: b.code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The real name on a bank account, straight from the bank. Throws if the account doesn't exist. */
export async function resolveAccount(accountNumber: string, bankCode: string) {
  const d = await call<{ account_name: string; account_number: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
  return d.account_name;
}

/** Saves the account with Paystack so we can pay it; returns the recipient code. */
export async function createRecipient(p: { name: string; accountNumber: string; bankCode: string }) {
  const d = await call<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({ type: "nuban", name: p.name, account_number: p.accountNumber, bank_code: p.bankCode, currency: "NGN" }),
  });
  return d.recipient_code;
}

export type PaystackTransfer = { status: string; reference: string; amount: number; transfer_code?: string; reason?: string };

/**
 * Sends naira to a recipient. The reference is fixed per job, so Paystack refuses a second
 * transfer with it: a job can never be paid twice, even if this runs again.
 */
export function sendTransfer(p: { naira: number; recipient: string; reference: string; reason: string }) {
  return call<PaystackTransfer>("/transfer", {
    method: "POST",
    body: JSON.stringify({ source: "balance", amount: Math.round(p.naira * 100), currency: "NGN", recipient: p.recipient, reference: p.reference, reason: p.reason }),
  });
}

/** Asks Paystack what happened to a transfer. */
export const checkTransfer = (reference: string) => call<PaystackTransfer>(`/transfer/verify/${encodeURIComponent(reference)}`);

/** Automatic payouts are on only when PAYSTACK_AUTO_PAYOUTS=on (and Paystack is set up). */
export const autoPayoutsOn = () => paystackReady() && process.env.PAYSTACK_AUTO_PAYOUTS?.trim().toLowerCase() === "on";

/** Refunds a client's Paystack payment in full (Paystack sends it back to their card or account). */
export function refundPayment(reference: string) {
  return call<{ status: string }>("/refund", { method: "POST", body: JSON.stringify({ transaction: reference }) });
}
