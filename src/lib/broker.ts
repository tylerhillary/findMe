import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { notify } from "./notify";
import { emailAdmins } from "./admin";
import { AUTO_CONFIRM_MS } from "./jobs";
import type { JobDoc } from "./schema";

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
