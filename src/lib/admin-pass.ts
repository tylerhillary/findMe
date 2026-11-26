import "server-only";
import { db } from "./firebase-admin";

const MAX_AGE_MS = 60_000;

/**
 * Checks a one-time pass from the admin panel (find-me-admin). The admin writes it to
 * catalog_refresh/{id} just before calling; only server code with database access can, never
 * browsers. Valid if under a minute old; used up here so a copied request can't be replayed.
 */
export async function redeemAdminPass(pass: unknown): Promise<boolean> {
  const id = typeof pass === "string" ? pass : "";
  if (!/^[A-Za-z0-9]{20,40}$/.test(id)) return false;
  const ref = db().collection("catalog_refresh").doc(id);
  return db().runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists) return false;
    t.delete(ref);
    return Date.now() - Number(snap.get("createdAt") ?? 0) < MAX_AGE_MS;
  });
}
