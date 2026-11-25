import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./firebase-admin";
import type { UserDoc } from "./schema";

const adminEmails = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Admins: anyone whose email is in ADMIN_EMAILS, or whose profile has admin: true. */
export async function isAdmin(uid: string, email: string) {
  if (email && adminEmails().includes(email.toLowerCase())) return true;
  const u = (await db().collection("users").doc(uid).get()).data() as (UserDoc & { admin?: boolean }) | undefined;
  return u?.admin === true;
}

/**
 * The 4-digit code someone reads out when findMe calls to verify their number. Made once and kept,
 * so the dashboard and the admin list always show the same one.
 */
export async function getCallCode(uid: string): Promise<string> {
  const ref = db().collection("users").doc(uid);
  const existing = (await ref.get()).get("callCode") as string | undefined;
  if (existing) return existing;
  const code = String(randomInt(1000, 10000));
  await ref.update({ callCode: code });
  return code;
}
