import "server-only";
import { after } from "next/server";
import { db } from "./firebase-admin";
import { emailLayout, sendEmail, type EmailExtras } from "./email";
import type { NotificationDoc, NotificationKind, UserDoc } from "./schema";

const notifications = () => db().collection("notifications");

/**
 * Tells a user something happened: an in-app notification (bell + badge) and, when email is
 * configured, an email. Chat messages are throttled — one alert per conversation until it's read —
 * so a busy chat doesn't flood anyone's inbox.
 */
export async function notify(n: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  requestId?: string | null;
  cta?: string;
  /** Email-only: a custom subject line and extra content (quote, details). */
  email?: EmailExtras & { subject?: string };
}) {
  if (n.kind === "message" && n.requestId) {
    const unread = await notifications()
      .where("userId", "==", n.userId)
      .where("requestId", "==", n.requestId)
      .where("kind", "==", "message")
      .where("read", "==", false)
      .limit(1)
      .get();
    if (!unread.empty) return;
  }

  await notifications().add({
    userId: n.userId,
    kind: n.kind,
    title: n.title,
    body: n.body,
    href: n.href,
    requestId: n.requestId ?? null,
    read: false,
    createdAt: Date.now(),
  } satisfies NotificationDoc);

  // Email after the response is sent, so the person taking the action never waits on it.
  after(async () => {
    const u = (await db().collection("users").doc(n.userId).get()).data() as UserDoc | undefined;
    if (!u?.email) return;
    await sendEmail({
      to: u.email,
      subject: n.email?.subject ?? n.title,
      html: emailLayout({ name: u.name, title: n.title, body: n.body, href: n.href, cta: n.cta ?? "Open findMe", ...n.email }),
    });
  });
}

/** Marks a user's notifications as read — all of them, or just those for one conversation. */
export async function markNotificationsRead(userId: string, requestId?: string) {
  let q = notifications().where("userId", "==", userId).where("read", "==", false);
  if (requestId) q = q.where("requestId", "==", requestId);
  const snap = await q.limit(200).get();
  if (snap.empty) return 0;
  const batch = db().batch();
  for (const d of snap.docs) batch.update(d.ref, { read: true });
  await batch.commit();
  return snap.size;
}
