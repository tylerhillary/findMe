import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { notify } from "./notify";
import type { MessageDoc, ReportDoc, RequestDoc } from "./schema";

/** When the pro says a job is done and the client doesn't answer, it's confirmed after this long. */
export const AUTO_CONFIRM_MS = 3 * 86_400_000;

const requests = () => db().collection("requests");

/** Deletes a completed job's chat. */
export async function clearChat(ref: FirebaseFirestore.DocumentReference) {
  await db().recursiveDelete(ref.collection("messages")).catch((e) => console.error("[findMe] couldn't clear chat:", e));
  await ref.update({ messageCount: 0, chatClearedAt: Date.now(), chatHeldForReport: FieldValue.delete() }).catch(() => {});
}

/**
 * Marks an accepted job completed (client confirmed, or no answer within AUTO_CONFIRM_MS).
 * Counts the job for the pro, clears the chat (or keeps it while a report between them is open)
 * and tells both people. Returns false if the job wasn't in a state to complete.
 * The caller refreshes the search catalog (it differs between actions and page renders).
 */
export async function completeJob(id: string, by: { id: string; name: string } | "auto"): Promise<boolean> {
  const ref = requests().doc(id);
  const r = await db().runTransaction(async (t) => {
    const r = (await t.get(ref)).data() as RequestDoc | undefined;
    if (!r || r.status !== "accepted") return null;
    if (by === "auto" && !(r.doneRequestedAt && Date.now() - r.doneRequestedAt >= AUTO_CONFIRM_MS)) return null;
    const now = Date.now();
    const note = `__status__:${by === "auto" ? "job confirmed as completed automatically" : "confirmed the job is completed"}`;
    t.update(ref, { status: "completed", doneRequestedAt: FieldValue.delete(), updatedAt: now, lastMessage: note, messageCount: FieldValue.increment(1) });
    t.set(ref.collection("messages").doc(), { senderId: by === "auto" ? r.providerId : by.id, body: note, createdAt: now } satisfies MessageDoc);
    t.update(db().collection("users").doc(r.providerId), { jobsDone: FieldValue.increment(1) });
    return r;
  });
  if (!r) return false;

  // Job done: delete the chat for both people's privacy (the page hides numbers again).
  // If either has an open report against the other, keep it as evidence until an admin decides.
  const [a, b] = await db().getAll(db().collection("reports").doc(`${r.clientId}__${r.providerId}`), db().collection("reports").doc(`${r.providerId}__${r.clientId}`));
  if ([a, b].some((d) => d.exists && (d.data() as ReportDoc).status === "open")) await ref.update({ chatHeldForReport: true }).catch(() => {});
  else await clearChat(ref);

  const href = `/dashboard/requests/${id}`;
  if (by === "auto") {
    await notify({ userId: r.clientId, kind: "status", requestId: id, title: "Your job was marked complete", body: `“${r.title}” was confirmed as done after 3 days. How did it go? Leave a rating and a short comment.`, href: `${href}#review`, cta: "Rate & review" });
    await notify({ userId: r.providerId, kind: "status", requestId: id, title: "Job confirmed as done", body: `“${r.title}” was confirmed automatically after 3 days. It now counts towards your jobs done.`, href, cta: "View job" });
  } else {
    await notify({ userId: r.providerId, kind: "status", requestId: id, title: `${by.name.split(" ")[0]} confirmed the job is done`, body: `“${r.title}” is complete and counts towards your jobs done. Their review will show on your profile.`, href, cta: "View job" });
  }
  return true;
}

/**
 * Completes any of these jobs where the pro said "done" over 3 days ago and the client never
 * answered. Called when people open their requests, so no scheduled job is needed.
 */
export async function settleOverdueJobs(rs: { id: string; status: string; doneRequestedAt?: number }[]): Promise<number> {
  const due = rs.filter((r) => r.status === "accepted" && r.doneRequestedAt && Date.now() - r.doneRequestedAt >= AUTO_CONFIRM_MS);
  const done = await Promise.all(due.map((r) => completeJob(r.id, "auto").catch(() => false)));
  return done.filter(Boolean).length;
}
