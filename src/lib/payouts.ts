import "server-only";
import { createHash } from "node:crypto";
import { db } from "./firebase-admin";
import { notify } from "./notify";
import { emailAdmins } from "./admin";
import { checkTransfer, paystackReady, sendTransfer, type PaystackTransfer } from "./paystack";
import type { JobDoc, PayoutDoc } from "./schema";

const naira = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
const jobs = () => db().collection("jobs");

/**
 * The Paystack reference for paying a job's pro. Paystack wants lowercase letters, digits and
 * dashes, so it's a hash of the job id; the attempt number only changes after a transfer
 * Paystack has confirmed failed, so the same money can never go out twice.
 */
export function payoutRefFor(jobId: string, attempt: number) {
  return `fmpay-${createHash("sha1").update(jobId).digest("hex").slice(0, 24)}-${attempt}`;
}

const FAILED = ["failed", "reversed", "abandoned", "rejected", "blocked"];

type Result = { ok?: true; status?: JobDoc["payoutStatus"]; error?: string };

/** Marks the pro paid (once) and tells them. Used by Paystack transfers and the admin "Pro paid" button. */
export async function markProPaid(jobId: string, how: "paystack" | "manual"): Promise<boolean> {
  const ref = jobs().doc(jobId);
  const job = await db().runTransaction(async (t) => {
    const j = (await t.get(ref)).data() as JobDoc | undefined;
    if (!j || j.status !== "completed" || !j.proId || j.proPaidAt) return null;
    const now = Date.now();
    t.update(ref, { proPaidAt: now, payoutStatus: how === "paystack" ? "success" : j.payoutStatus ?? null, payoutError: null, updatedAt: now });
    return j;
  });
  if (!job) return false;
  await notify({
    userId: job.proId!,
    kind: "status",
    title: `You've been paid ${naira(job.proPayout)}`,
    body: `findMe has sent your payment for "${job.title}"${how === "paystack" ? " to your bank account" : ""}. Thanks for doing great work!`,
    href: `/dashboard/jobs/${jobId}`,
    cta: "View job",
  });
  return true;
}

/** Records what Paystack says about a transfer. */
async function applyTransfer(jobId: string, tx: PaystackTransfer): Promise<Result> {
  const s = tx.status;
  if (s === "success") {
    await markProPaid(jobId, "paystack");
    return { ok: true, status: "success" };
  }
  if (s === "otp") {
    await jobs().doc(jobId).update({ payoutStatus: "otp", payoutError: "Paystack is asking for an OTP. Turn off transfer OTP in Paystack, then send again.", updatedAt: Date.now() });
    return { error: "Paystack wants an OTP for this transfer. Turn off 'Confirm transfers before sending' in Paystack settings." };
  }
  if (FAILED.includes(s)) {
    await payoutFailed(jobId, `Paystack says the transfer ${s}.`);
    return { error: `The transfer ${s}.` };
  }
  // pending, processing, received, queued: Paystack's webhook will tell us how it ends.
  await jobs().doc(jobId).update({ payoutStatus: "pending", payoutError: null, updatedAt: Date.now() });
  return { ok: true, status: "pending" };
}

async function payoutFailed(jobId: string, why: string) {
  await jobs().doc(jobId).update({ payoutStatus: "failed", payoutError: why.slice(0, 300), updatedAt: Date.now() });
  const job = (await jobs().doc(jobId).get()).data() as JobDoc | undefined;
  await emailAdmins({
    subject: `Pro payout failed: ${job ? naira(job.proPayout) : ""} for "${job?.title ?? jobId}"`,
    title: "A pro payout didn't go through",
    body: `${why} Check the pro's bank details or your Paystack balance, then send it again or pay by hand.`,
    href: `/admin/jobs#${jobId}`,
    cta: "Open job",
  }).catch(() => {});
}

/**
 * Pays the pro their share of a completed job from findMe's Paystack balance.
 * Only for jobs the client has paid for, to a bank account Paystack has verified, and never twice.
 */
export async function sendProPayout(jobId: string): Promise<Result> {
  if (!paystackReady()) return { error: "Paystack isn't set up." };
  const ref = jobs().doc(jobId);
  const before = (await ref.get()).data() as JobDoc | undefined;
  if (!before || before.status !== "completed" || !before.proId) return { error: "Pay the pro once the client has confirmed the job." };
  if (before.proPaidAt) return { error: "This pro has already been paid." };
  if (!before.paidAt) return { error: "findMe hasn't received the client's payment for this job." };
  if (!(before.proPayout > 0)) return { error: "This job has no pro pay set." };

  // A retry: first ask Paystack what happened to the last attempt. Only a transfer Paystack
  // says failed, or never received, is tried again.
  if (before.payoutRef) {
    let last: PaystackTransfer | null = null;
    try {
      last = await checkTransfer(before.payoutRef);
    } catch (e) {
      if (!/not found/i.test((e as Error).message)) return { error: `Couldn't check the last attempt with Paystack: ${(e as Error).message}` };
    }
    if (last && !FAILED.includes(last.status)) return applyTransfer(jobId, last);
  }

  const payout = (await db().collection("payouts").doc(before.proId).get()).data() as PayoutDoc | undefined;
  if (!payout?.recipientCode) return { error: "The pro hasn't verified their bank account yet. Pay by hand, or ask them to re-save it in their profile." };

  // Claim the payout so two requests can't both send it. One still being sent (in the last
  // 10 minutes) is left alone.
  const claimed = await db().runTransaction(async (t) => {
    const j = (await t.get(ref)).data() as JobDoc | undefined;
    if (!j || j.proPaidAt || j.payoutRef !== before.payoutRef) return null;
    if (j.payoutStatus === "sending" && Date.now() - (j.payoutStartedAt ?? 0) < 10 * 60_000) return null;
    const attempt = (j.payoutAttempts ?? 0) + 1;
    const reference = payoutRefFor(jobId, attempt);
    const now = Date.now();
    t.update(ref, { payoutStatus: "sending", payoutRef: reference, payoutAttempts: attempt, payoutStartedAt: now, payoutError: null, updatedAt: now });
    return { reference, amount: j.proPayout, title: j.title };
  });
  if (!claimed) return { error: "A payout for this job is already on its way." };

  try {
    const tx = await sendTransfer({ naira: claimed.amount, recipient: payout.recipientCode, reference: claimed.reference, reason: `findMe job: ${claimed.title}`.slice(0, 100) });
    return applyTransfer(jobId, tx);
  } catch (e) {
    // The request failed, but the transfer may still have been created: ask Paystack.
    try {
      return await applyTransfer(jobId, await checkTransfer(claimed.reference));
    } catch {
      await payoutFailed(jobId, `Paystack refused the transfer: ${(e as Error).message}`);
      return { error: (e as Error).message };
    }
  }
}

/** Paystack's webhook said a transfer finished: check with Paystack and update the job. */
export async function settleTransferEvent(reference: string) {
  if (!reference.startsWith("fmpay-")) return;
  const snap = await jobs().where("payoutRef", "==", reference).limit(1).get();
  if (snap.empty) return;
  await applyTransfer(snap.docs[0].id, await checkTransfer(reference));
}
