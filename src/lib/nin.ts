import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/firebase-admin";
import type { IdentityDoc } from "@/lib/schema";

/**
 * NIN (National Identification Number) checks through Dojah (docs.dojah.io/docs/nigeria/lookup-nin).
 *
 * Privacy: the full NIN is never stored. We keep an HMAC fingerprint (so one NIN can only back one
 * account) and the last 4 digits (so the person can recognise it). Nothing else from NIMC is saved.
 *
 * Env (server only):
 *   DOJAH_APP_ID, DOJAH_SECRET_KEY  — from the Dojah dashboard
 *   DOJAH_BASE_URL                  — optional; https://sandbox.dojah.io for testing (default: https://api.dojah.io)
 *   NIN_HASH_SECRET                 — any long random string; never change it once set
 */

const MAX_ATTEMPTS_PER_DAY = 3;

export const cleanNin = (raw: string) => raw.replace(/\D/g, "");
export const isNinFormat = (nin: string) => /^\d{11}$/.test(nin);

export function ninChecksEnabled() {
  return !!(process.env.DOJAH_APP_ID && process.env.DOJAH_SECRET_KEY && process.env.NIN_HASH_SECRET);
}

const identities = () => db().collection("identity");
const ninIndex = () => db().collection("ninIndex");
const fingerprint = (nin: string) => createHmac("sha256", process.env.NIN_HASH_SECRET!).update(nin).digest("hex");
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

const nameTokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);

/** The account name must contain at least two of the names on the NIN record (any order). */
export function nameMatches(accountName: string, record: NinRecord) {
  const onRecord = new Set(nameTokens([record.first_name, record.middle_name, record.last_name].filter(Boolean).join(" ")));
  const hits = new Set(nameTokens(accountName).filter((t) => onRecord.has(t)));
  return hits.size >= 2;
}

type NinRecord = { first_name?: string; middle_name?: string; last_name?: string };
type Lookup =
  | { kind: "found"; record: NinRecord }
  | { kind: "not_found" }
  | { kind: "unavailable"; detail: string };

async function dojahLookup(nin: string): Promise<Lookup> {
  const base = (process.env.DOJAH_BASE_URL || "https://api.dojah.io").replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/api/v1/kyc/nin?nin=${nin}`, {
      headers: { AppId: process.env.DOJAH_APP_ID!, Authorization: process.env.DOJAH_SECRET_KEY! },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    return { kind: "unavailable", detail: `network: ${String(e)}` };
  }
  if (res.status === 404 || res.status === 400) return { kind: "not_found" };
  if (!res.ok) return { kind: "unavailable", detail: `HTTP ${res.status}` };
  const body = (await res.json().catch(() => null)) as { entity?: NinRecord } | null;
  return body?.entity ? { kind: "found", record: body.entity } : { kind: "not_found" };
}

export type NinResult = { verified: true } | { verified: false; error: string };

/** Checks a NIN for this account and, on success, marks the user as NIN-verified. */
export async function verifyNin(uid: string, accountName: string, rawNin: string): Promise<NinResult> {
  const nin = cleanNin(rawNin);
  if (!isNinFormat(nin)) return { verified: false, error: "Your NIN is the 11-digit number on your NIN slip or card." };
  if (!ninChecksEnabled()) {
    console.error("[findMe] NIN check skipped: DOJAH_APP_ID / DOJAH_SECRET_KEY / NIN_HASH_SECRET not set");
    return fail(uid, "ID checks are not available yet. Please try again later.", false);
  }

  const ref = identities().doc(uid);
  const current = (await ref.get()).data() as IdentityDoc | undefined;
  if (current?.status === "verified") return { verified: true };

  const day = today();
  const attempts = current?.attemptsDay === day ? current.attempts ?? 0 : 0;
  if (attempts >= MAX_ATTEMPTS_PER_DAY) {
    return { verified: false, error: "You've tried 3 times today. Please check your NIN and try again tomorrow." };
  }

  const hash = fingerprint(nin);
  const owner = await ninIndex().doc(hash).get();
  if (owner.exists && owner.data()?.uid !== uid) {
    return fail(uid, "This NIN is already linked to another findMe account. If that's not you, contact us.", false);
  }

  // Count the attempt before calling out, so failed calls still count against the daily limit.
  await ref.set({ attemptsDay: day, attempts: attempts + 1, lastTriedAt: Date.now() }, { merge: true });

  const lookup = await dojahLookup(nin);
  if (lookup.kind === "unavailable") {
    console.error("[findMe] Dojah NIN lookup failed:", lookup.detail);
    // Our side or NIMC's is down — don't count it against the person.
    await ref.set({ attempts: attempts }, { merge: true });
    return fail(uid, "We couldn't reach the NIN service just now. Please try again in a few minutes.", false);
  }
  if (lookup.kind === "not_found") return fail(uid, "We couldn't find that NIN. Check the 11 digits on your NIN slip and try again.");
  if (!nameMatches(accountName, lookup.record)) {
    return fail(uid, "The name on this NIN doesn't match your account name. Use your name as it appears on your NIN.");
  }

  try {
    await db().runTransaction(async (tx) => {
      const idx = await tx.get(ninIndex().doc(hash));
      if (idx.exists && idx.data()?.uid !== uid) throw new Error("taken");
      tx.set(ninIndex().doc(hash), { uid, createdAt: Date.now() });
      tx.set(ref, { status: "verified", ninHash: hash, ninLast4: nin.slice(-4), provider: "dojah", verifiedAt: Date.now(), lastError: null }, { merge: true });
      tx.update(db().collection("users").doc(uid), { ninVerified: true });
    });
  } catch (e) {
    if (String(e).includes("taken")) return fail(uid, "This NIN is already linked to another findMe account. If that's not you, contact us.", false);
    throw e;
  }
  return { verified: true };
}

async function fail(uid: string, error: string, record = true): Promise<NinResult> {
  if (record) await identities().doc(uid).set({ status: "failed", lastError: error }, { merge: true });
  else await identities().doc(uid).set({ lastError: error }, { merge: true });
  return { verified: false, error };
}

/** What the dashboard shows a pro about their NIN. */
export async function getNinStatus(uid: string): Promise<{ verified: boolean; last4: string | null; lastError: string | null }> {
  const d = (await identities().doc(uid).get()).data() as IdentityDoc | undefined;
  return { verified: d?.status === "verified", last4: d?.ninLast4 ?? null, lastError: d?.lastError ?? null };
}

/** Removes NIN records when an account is deleted. */
export async function deleteNinRecords(uid: string) {
  const d = (await identities().doc(uid).get()).data() as IdentityDoc | undefined;
  await Promise.all([identities().doc(uid).delete(), d?.ninHash ? ninIndex().doc(d.ninHash).delete() : null]);
}
