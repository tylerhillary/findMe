import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { notify } from "./notify";
import { emailAdmins } from "./admin";
import { AUTO_CONFIRM_MS } from "./jobs";
import { FINDME_FEE_LABEL, proPayoutFor } from "./fees";
import type { JobDoc, UserDoc } from "./schema";
import type { PaystackTx } from "./paystack";

const naira = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

/**
 * Completes a findMe job: client confirmed, or the pro said "done" 3+ days ago with no answer.
 * Counts it for the pro, asks the client for a review and tells the admins the pro can be paid.
 * The caller refreshes the search catalog when it can (server actions only).
 */
export async function completeBrokerJob(id: string, by: "client" | "auto"): Promise<boolean> {
  const ref = db().collection("jobs").doc(id);
  const job = await db().runTransaction(async (t) => {
    const j = (await t.get(ref)).data() as JobDoc | undefined;
    if (!j || j.status !== "assigned" || !j.proId) return null;
    if (by === "auto" && !(j.doneRequestedAt && Date.now() - j.doneRequestedAt >= AUTO_CONFIRM_MS)) return null;
    const now = Date.now();
    t.update(ref, { status: "completed", completedAt: now, doneRequestedAt: FieldValue.delete(), updatedAt: now });
    t.update(db().collection("users").doc(j.proId), { jobsDone: FieldValue.increment(1) });
    return j;
  });
  if (!job) return false;

  const href = `/dashboard/jobs/${id}`;
  await notify({
    userId: job.clientId,
    kind: "status",
    title: by === "auto" ? "Your job was marked complete" : "Thanks for confirming",
    body: `How did "${job.title}" go? Rate the pro and leave a short comment. It helps us send the best people.`,
    href: `${href}#review`,
    cta: "Rate & review",
  });
  await notify({
    userId: job.proId!,
    kind: "status",
    title: "Job confirmed as done",
    body: `"${job.title}" is complete. findMe will send your ${naira(job.proPayout)} shortly.`,
    href,
    cta: "View job",
  });
  await emailAdmins({
    subject: `Pay the pro: ${naira(job.proPayout)} for "${job.title}"`,
    title: "A job is complete. Time to pay the pro",
    body: `${by === "auto" ? "Confirmed automatically after 3 days." : "The client confirmed it's done."} Pay the pro ${naira(job.proPayout)} (client paid ${naira(job.price)}), then mark it paid.`,
    href: `/admin/jobs#${id}`,
    cta: "Open job",
  }).catch(() => {});
  return true;
}

/** Confirms any of these jobs where the pro said "done" over 3 days ago. Runs when jobs are viewed. */
export async function settleOverdueBrokerJobs(js: { id: string; status: string; doneRequestedAt?: number }[]): Promise<number> {
  const due = js.filter((j) => j.status === "assigned" && j.doneRequestedAt && Date.now() - j.doneRequestedAt >= AUTO_CONFIRM_MS);
  const done = await Promise.all(due.map((j) => completeBrokerJob(j.id, "auto").catch(() => false)));
  return done.filter(Boolean).length;
}

/**
 * Marks a job paid after Paystack confirms the money (called from the return page and the
 * webhook, so it must be safe to run twice). Checks the amount and currency match the price.
 */
export async function recordPaystackPayment(jobId: string, tx: PaystackTx): Promise<boolean> {
  if (tx.status !== "success" || tx.currency !== "NGN" || !jobId) return false;
  const ref = db().collection("jobs").doc(jobId.slice(0, 128));
  const job = await db().runTransaction(async (t) => {
    const j = (await t.get(ref)).data() as JobDoc | undefined;
    if (!j || j.status !== "quoted" || tx.amount < Math.round(j.price * 100)) return null;
    const now = Date.now();
    t.update(ref, { status: j.proId ? "assigned" : "paid", paidAt: now, paidVia: "paystack", paystackRef: tx.reference, updatedAt: now });
    return j;
  });
  if (!job) return false;

  await notify({
    userId: job.clientId,
    kind: "status",
    title: "Payment received",
    body: `Thanks! We got ${naira(job.price)} for "${job.title}". ${job.proId ? "Your pro will call you soon." : "We're assigning a pro and they'll call you soon."}`,
    href: `/dashboard/jobs/${ref.id}`,
    cta: "View job",
  });
  await emailAdmins({
    subject: `Paid on Paystack: ${naira(job.price)} for "${job.title}"`,
    title: `${job.clientName} paid ${naira(job.price)}`,
    body: `Paystack confirmed the payment (ref ${tx.reference}). ${job.proId ? "The pro is already assigned." : "Assign a pro next."}`,
    href: `/admin/jobs#${ref.id}`,
    cta: "Open job",
  }).catch(() => {});
  return true;
}

/**
 * Bargaining: tells a pro (usually the one the client picked) what the client offered, and asks
 * them to accept it or name their final price. Clears any earlier answer. Bell + email.
 */
export async function askProAboutOffer(jobId: string, proId: string): Promise<boolean> {
  const ref = db().collection("jobs").doc(jobId);
  const j = (await ref.get()).data() as JobDoc | undefined;
  if (!j || !j.clientOffer || (j.status !== "new" && j.status !== "quoted")) return false;
  const pro = (await db().collection("users").doc(proId).get()).data() as UserDoc | undefined;
  if (!pro || pro.role !== "provider" || pro.banned) return false;
  await ref.update({ askProId: proId, askedAt: Date.now(), proAnswer: FieldValue.delete() });
  await notify({
    userId: proId,
    kind: "request",
    title: `A client offered ${naira(j.clientOffer)} for your service`,
    body: `"${j.title}" in ${j.location}${j.when ? `, ${j.when}` : ""}.${j.price ? ` findMe had quoted ${naira(j.price)}.` : ""} If you accept, you get ${naira(proPayoutFor(j.clientOffer))} after findMe's ${FINDME_FEE_LABEL}. Accept the offer, or tell us your final price.`,
    href: `/dashboard/jobs/${jobId}`,
    cta: "Answer the offer",
  });
  return true;
}
