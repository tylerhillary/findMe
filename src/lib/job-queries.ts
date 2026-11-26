import "server-only";
import { connection } from "next/server";
import { db } from "./firebase-admin";
import { settleOverdueBrokerJobs } from "./broker";
import type { JobDoc, UserDoc } from "./schema";
import { hasTeamBadge } from "./team";

export type JobWithId = JobDoc & { id: string };

/** findMe's bank details, shown to clients when they need to pay (set on Vercel). */
export function bankDetails() {
  const bank = process.env.FINDME_BANK_NAME ?? "";
  const accountName = process.env.FINDME_BANK_ACCOUNT_NAME ?? "";
  const accountNumber = process.env.FINDME_BANK_ACCOUNT_NUMBER ?? "";
  return bank && accountNumber ? { bank, accountName, accountNumber } : null;
}

/** "Ben" or "Ben's Plumbing": what clients see of a pro (no surname, no contact). */
export const proShownName = (u: Pick<UserDoc, "name" | "businessName">) => u.businessName?.trim() || u.name.split(" ")[0];

async function load(field: "clientId" | "proId", uid: string) {
  const snap = await db().collection("jobs").where(field, "==", uid).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as JobDoc) }));
}

/** Jobs I asked for, and jobs findMe gave me to do. Auto-confirms overdue "done" jobs first. */
export async function getMyJobs(uid: string) {
  await connection();
  let [asked, assigned] = await Promise.all([load("clientId", uid), load("proId", uid)]);
  if (await settleOverdueBrokerJobs([...asked, ...assigned])) [asked, assigned] = await Promise.all([load("clientId", uid), load("proId", uid)]);
  const byNew = (a: JobWithId, b: JobWithId) => b.updatedAt - a.updatedAt;
  return { asked: asked.sort(byNew), assigned: assigned.filter((j) => j.status !== "cancelled" || j.assignedAt).sort(byNew) };
}

/** One job, for its client, its assigned pro, or an admin. */
export async function getJob(id: string, uid: string, admin = false) {
  await connection();
  const ref = db().collection("jobs").doc(id.slice(0, 128));
  let job = (await ref.get()).data() as JobDoc | undefined;
  if (!job) return null;
  if (await settleOverdueBrokerJobs([{ id: ref.id, ...job }])) job = (await ref.get()).data() as JobDoc;
  const role = job.clientId === uid ? "client" : job.proId === uid ? "pro" : admin ? "admin" : null;
  if (!role) return null;
  const [proSnap, reviewSnap] = await Promise.all([
    job.proId ? db().collection("users").doc(job.proId).get() : Promise.resolve(null),
    db().collection("reviews").doc(ref.id).get(),
  ]);
  const p = proSnap?.data() as UserDoc | undefined;
  const r = reviewSnap.data() as { rating: number; comment: string } | undefined;
  return {
    job: { id: ref.id, ...job },
    role,
    // The client only ever sees this much about the pro: no number, no surname.
    pro: p && job.proId ? { id: job.proId, name: proShownName(p), avatar: p.avatar ?? null, headline: p.headline ?? "", rating: p.reviewCount ? Math.round(((p.ratingSum ?? 0) / p.reviewCount) * 10) / 10 : 0, reviewCount: p.reviewCount ?? 0, team: hasTeamBadge(p) } : null,
    clientTeam: hasTeamBadge((await db().collection("users").doc(job.clientId).get()).data() as UserDoc | undefined),
    review: r ? { rating: r.rating, comment: r.comment } : null,
  };
}
