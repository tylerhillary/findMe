import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { adminAuth, db } from "./firebase-admin";
import type { PhoneVerificationDoc, UserDoc } from "./schema";

/**
 * Free WhatsApp number verification ("reverse" verification).
 *
 * The pro sends a WhatsApp message containing their personal code TO findMe's WhatsApp number.
 * Because it arrives from their own WhatsApp, it proves they own that number. Receiving messages
 * (and replying within 24 hours) is free on Meta's WhatsApp Business Platform.
 *
 * Approval happens either:
 *  - automatically, through the Meta webhook (/api/whatsapp/webhook) once the site is online, or
 *  - manually, by an admin at /admin/verifications after checking the message in WhatsApp.
 *
 * Environment:
 *   NEXT_PUBLIC_FINDME_WHATSAPP   findMe's WhatsApp number, e.g. +2348012345678 (required)
 *   WHATSAPP_VERIFY_TOKEN         any secret string you also enter in Meta's webhook settings
 *   WHATSAPP_APP_SECRET           your Meta app secret (to check that webhook calls really come from Meta)
 *   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID   optional: send a free "you're verified" reply
 */

export const FINDME_WHATSAPP = (process.env.NEXT_PUBLIC_FINDME_WHATSAPP ?? "").replace(/[^\d+]/g, "");
export const VERIFY_TTL_MS = 24 * 3_600_000;

export const verifications = () => db().collection("phone_verifications");

export const newCode = () => `FM-${String(randomInt(100_000, 1_000_000))}`;
export const verificationText = (code: string) => `Verify my findMe number: ${code}`;
export const waLink = (code: string) => `https://wa.me/${FINDME_WHATSAPP.replace(/^\+/, "")}?text=${encodeURIComponent(verificationText(code))}`;

/** Marks the user's current number verified (only if it still matches the one they verified). */
export async function approveVerification(uid: string, via: PhoneVerificationDoc["approvedVia"]): Promise<"ok" | "missing" | "changed"> {
  const vRef = verifications().doc(uid);
  const uRef = db().collection("users").doc(uid);
  return db().runTransaction(async (t) => {
    const [vSnap, uSnap] = await Promise.all([t.get(vRef), t.get(uRef)]);
    const v = vSnap.data() as PhoneVerificationDoc | undefined;
    const u = uSnap.data() as UserDoc | undefined;
    if (!v || !u) return "missing";
    if (u.phone !== v.phone) {
      t.delete(vRef);
      return "changed";
    }
    t.update(uRef, { phoneVerified: true });
    t.update(vRef, { status: "approved", approvedVia: via, decidedAt: Date.now() });
    return "ok";
  });
}

/** True when the request body really was signed by Meta with our app secret. */
export function validMetaSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(header.slice(7));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Optional free reply inside the 24-hour window after the user messaged us. */
export async function replyOnWhatsApp(toDigits: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: toDigits, type: "text", text: { body: text } }),
  }).catch((e) => console.error("[whatsapp] reply failed", e));
}

/** True when the Meta webhook is configured, so messages are approved automatically. */
export const autoVerification = () => !!(process.env.WHATSAPP_APP_SECRET && process.env.WHATSAPP_VERIFY_TOKEN);

/** Account ids of everyone allowed to approve verifications. */
export async function adminUserIds(): Promise<string[]> {
  const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const [byEmail, flagged] = await Promise.all([
    emails.length ? adminAuth().getUsers(emails.map((email) => ({ email }))) : Promise.resolve({ users: [] }),
    db().collection("users").where("admin", "==", true).select().get(),
  ]);
  return [...new Set([...byEmail.users.map((u) => u.uid), ...flagged.docs.map((d) => d.id)])];
}

/** Admins: anyone whose email is in ADMIN_EMAILS, or whose profile has admin: true. */
export async function isAdmin(uid: string, email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (email && list.includes(email.toLowerCase())) return true;
  const u = (await db().collection("users").doc(uid).get()).data() as (UserDoc & { admin?: boolean }) | undefined;
  return u?.admin === true;
}

/** A pro's number status for the dashboard: verified, waiting for an admin, or not started. */
export async function getPhoneStatus(uid: string): Promise<"verified" | "pending" | "rejected" | "none"> {
  const [u, v] = await Promise.all([db().collection("users").doc(uid).get(), verifications().doc(uid).get()]);
  if ((u.data() as UserDoc | undefined)?.phoneVerified) return "verified";
  const d = v.data() as PhoneVerificationDoc | undefined;
  if (d?.status === "pending" && d.expiresAt > Date.now()) return "pending";
  return d?.status === "rejected" ? "rejected" : "none";
}

/** How many verifications are waiting for an admin. */
export async function pendingVerificationCount() {
  return (await verifications().where("status", "==", "pending").count().get()).data().count;
}
