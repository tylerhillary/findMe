import { revalidateTag } from "next/cache";
import { db } from "@/lib/firebase-admin";
import { CATALOG_TAG } from "@/lib/queries";

/**
 * The admin panel (find-me-admin) calls this right after it changes anything the public pages show
 * (bans, hiding, badges, pro side, reviews, phone verification), so search and profiles update at
 * once instead of when the cache runs out.
 *
 * Proof it's really the admin: before calling, the admin writes a one-time pass to
 * catalog_refresh/{id} (only server code with database access can, never browsers). The pass must
 * be under a minute old and is used up here, so a copied request can't be replayed.
 */
const MAX_AGE_MS = 60_000;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { pass?: unknown } | null;
  const id = typeof body?.pass === "string" ? body.pass : "";
  if (!/^[A-Za-z0-9]{20,40}$/.test(id)) return new Response(null, { status: 401 });

  const ref = db().collection("catalog_refresh").doc(id);
  const valid = await db().runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists) return false;
    t.delete(ref);
    return Date.now() - Number(snap.get("createdAt") ?? 0) < MAX_AGE_MS;
  });
  if (!valid) return new Response(null, { status: 401 });

  // expire: 0 = never serve the old copy; the next visit reads fresh data.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
