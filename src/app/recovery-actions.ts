"use server";

import { createHash } from "node:crypto";
import { after } from "next/server";
import { refresh } from "next/cache";
import { adminAuth, db } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/auth";
import { emailAdmins, isAdmin } from "@/lib/admin";
import { APP_URL, emailLayout, sendEmail } from "@/lib/email";
import { formatNgPhone, normalizeNgPhone } from "@/lib/phone";
import type { RecoveryDoc, UserDoc } from "@/lib/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const recovery = () => db().collection("recovery_requests");

export type RecoveryState = { ok?: true; error?: string; fieldErrors?: Record<string, string> };

/**
 * "I can't get into my email." Saves a request for findMe to call the number on the account.
 * Answers the same way whether or not an account has that number, so nobody can use it to look
 * people up. At most 2 requests per number per day.
 */
export async function requestRecoveryAction(_: RecoveryState, fd: FormData): Promise<RecoveryState> {
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const phoneRaw = String(fd.get("phone") ?? "").trim().slice(0, 30);
  const newEmail = String(fd.get("newEmail") ?? "").trim().toLowerCase().slice(0, 120);
  const note = String(fd.get("note") ?? "").trim().slice(0, 600);
  const phone = normalizeNgPhone(phoneRaw);

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Enter the name on your findMe account.";
  if (!phone) fieldErrors.phone = phoneRaw ? "Enter a valid Nigerian number, e.g. 0803 123 4567." : "Enter the phone number on your findMe account.";
  if (!EMAIL_RE.test(newEmail)) fieldErrors.newEmail = "Enter an email address you can open now.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const limitRef = db().collection("reset_requests").doc(createHash("sha256").update(`recovery:${phone}`).digest("hex"));
  const now = Date.now();
  const recent = (((await limitRef.get()).data()?.sentAt as number[] | undefined) ?? []).filter((t) => now - t < 86_400_000);
  if (recent.length >= 2) return { error: "We already have your request. findMe will call you soon." };
  await limitRef.set({ sentAt: [...recent, now] });

  const match = await db().collection("users").where("phone", "==", phone!).limit(1).get();
  const userId = match.docs[0]?.id ?? null;
  const ref = recovery().doc();
  await ref.set({ phone: phone!, newEmail, name, note, userId, status: "open", createdAt: now } satisfies RecoveryDoc);

  after(() =>
    emailAdmins({
      subject: `Account recovery: call ${formatNgPhone(phone!)}`,
      title: `${name} can't get into their email`,
      body: userId
        ? "An account has this phone number. Call it, make sure it's really them, then approve to move the account to their new email."
        : "No findMe account has this phone number. They may have typed it wrong, or signed up with another number.",
      href: "/admin/recovery",
      cta: "Open account recovery",
      details: [["Phone", formatNgPhone(phone!)], ["New email", newEmail], ["Name given", name]],
      quote: note ? { from: name, text: note } : undefined,
    }).catch((e) => console.error("[findMe] recovery email failed:", e)),
  );
  return { ok: true };
}

async function adminOnly() {
  const user = await requireUser("/admin/recovery");
  if (!(await isAdmin(user.id, user.email))) throw new Error("Only admins can do this.");
  return user;
}

/**
 * Admin, after calling them: moves the account to the new email and sends a reset link there.
 * The old address gets a heads-up, in case this wasn't them.
 */
export async function approveRecoveryAction(id: string): Promise<{ ok?: true; error?: string }> {
  let admin;
  try {
    admin = await adminOnly();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const ref = recovery().doc(String(id).slice(0, 128));
  const r = (await ref.get()).data() as RecoveryDoc | undefined;
  if (!r || r.status !== "open") return { error: "This request was already handled." };
  if (!r.userId) return { error: "No account has this phone number, so there's nothing to recover." };

  const userRef = db().collection("users").doc(r.userId);
  const u = (await userRef.get()).data() as UserDoc | undefined;
  if (!u) return { error: "That account no longer exists." };
  const existing = await adminAuth().getUserByEmail(r.newEmail).catch(() => null);
  if (existing && existing.uid !== r.userId) return { error: `${r.newEmail} already belongs to another findMe account. Ask them for a different email.` };

  const oldEmail = u.email;
  try {
    await adminAuth().updateUser(r.userId, { email: r.newEmail, emailVerified: false });
  } catch (e) {
    console.error("[findMe] recovery email change failed:", e);
    return { error: "Couldn't change the account's email. Try again." };
  }
  await userRef.update({ email: r.newEmail, emailVerified: false });
  await ref.update({ status: "approved", decidedAt: Date.now(), decidedBy: admin.email });

  const link = await adminAuth().generatePasswordResetLink(r.newEmail);
  const code = new URL(link).searchParams.get("oobCode");
  const url = code ? `${APP_URL}/reset-password?oobCode=${encodeURIComponent(code)}` : link;
  const first = u.name.split(" ")[0];
  const sent = await sendEmail({
    to: r.newEmail,
    subject: "Your findMe account is back",
    html: emailLayout({
      name: first,
      title: "Choose a new password",
      body: "Thanks for confirming on the phone. Your findMe account now uses this email. Tap the button to choose a new password, then sign in with this email. The link works once and expires in 1 hour.",
      href: url,
      cta: "Choose a new password",
      footnote: "If the link expires, use “Forgot password” on the sign-in page with this email.",
    }),
  });
  if (oldEmail && oldEmail !== r.newEmail) {
    after(() =>
      sendEmail({
        to: oldEmail,
        subject: "Your findMe sign-in email was changed",
        html: emailLayout({
          name: first,
          title: "Your sign-in email was changed",
          body: `After a phone call with findMe, your account's sign-in email was changed to ${r.newEmail}. If this wasn't you, contact findMe right away.`,
          href: `${APP_URL}/contact`,
          cta: "Contact findMe",
        }),
      }).catch(() => {}),
    );
  }
  refresh();
  return sent ? { ok: true } : { error: `Email changed to ${r.newEmail}, but the reset email didn't send. Ask them to use "Forgot password" with that email.` };
}

/** Admin: couldn't confirm it was them (or no such account). Closes the request. */
export async function rejectRecoveryAction(id: string): Promise<{ ok?: true; error?: string }> {
  let admin;
  try {
    admin = await adminOnly();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const ref = recovery().doc(String(id).slice(0, 128));
  const r = (await ref.get()).data() as RecoveryDoc | undefined;
  if (!r || r.status !== "open") return { error: "This request was already handled." };
  await ref.update({ status: "rejected", decidedAt: Date.now(), decidedBy: admin.email });
  refresh();
  return { ok: true };
}
