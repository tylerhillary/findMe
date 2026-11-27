import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { notify } from "./notify";
import { emailAdmins } from "./admin";
import { AUTO_CONFIRM_MS } from "./jobs";
import type { JobDoc } from "./schema";
import { claimOpen } from "./guarantee";
import { autoPayoutsOn, type PaystackTx } from "./paystack";
import { sendProPayout } from "./payouts";

const naira = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

/**
 * Completes a findMe job: client confirmed, or the pro said "done" 3+ days ago with no answer.
 * Counts it for the pro, asks the client for a review and tells the admins the pro can be paid.
 * The caller refreshes the search catalog when it can (server actions only).
 */
export async function completeBrokerJob(id: string, by: "client" | "auto" | "admin"): Promise<boolean> {
  const ref = db().collection("jobs").doc(id);
  const job = await db().runTransaction(async (t) => {
    const j = (await t.get(ref)).data() as JobDoc | undefined;
    if (!j || j.status !== "assigned" || !j.proId) return null;
    if (by === "auto" && !(j.doneRequestedAt && Date.now() - j.doneRequestedAt >= AUTO_CONFIRM_MS)) return null;
    // A reported problem stops the automatic confirmation until findMe has decided.
    if (by === "auto" && claimOpen(j)) return null;
    const now = Date.now();
    // The client confirming while their report is open means they're now happy with it.
    const withdrawn = by === "client" && claimOpen(j) ? { claim: { ...j.claim!, outcome: "withdrawn" as const, resolvedAt: now } } : {};
    t.update(ref, { status: "completed", completedAt: now, doneRequestedAt: FieldValue.delete(), updatedAt: now, ...withdrawn });
    t.update(db().collection("users").doc(j.proId), { jobsDone: FieldValue.increment(1) });
    return j;
  });
  if (!job) return false;

  const href = `/dashboard/jobs/${id}`;
  await notify({
    userId: job.clientId,
    kind: "status",
    title: by === "client" ? "Thanks for confirming" : "Your job was marked complete",
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
  // Automatic payouts: Paystack sends the pro's share now. If it can't, an admin is emailed below.
  const auto = autoPayoutsOn() ? await sendProPayout(id).catch((e) => ({ error: (e as Error).message } as { ok?: true; error?: string })) : null;
  if (auto?.ok) return true;

  await emailAdmins({
    subject: `Pay the pro: ${naira(job.proPayout)} for "${job.title}"`,
    title: "A job is complete. Time to pay the pro",
    body: `${by === "auto" ? "Confirmed automatically after 3 days." : by === "admin" ? "findMe closed the problem report as not covered." : "The client confirmed it's done."} Pay the pro ${naira(job.proPayout)} (client paid ${naira(job.price)}), then mark it paid.${auto?.error ? ` Automatic payout didn't go: ${auto.error}` : ""}`,
    href: `/admin/jobs#${id}`,
    cta: "Open job",
  }).catch(() => {});
  return true;
}

/** Confirms any of these jobs where the pro said "done" over 3 days ago. Runs when jobs are viewed. */
export async function settleOverdueBrokerJobs(js: { id: string; status: string; doneRequestedAt?: number; claim?: JobDoc["claim"] }[]): Promise<number> {
  const due = js.filter((j) => j.status === "assigned" && j.doneRequestedAt && Date.now() - j.doneRequestedAt >= AUTO_CONFIRM_MS && !claimOpen(j));
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

