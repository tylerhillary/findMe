import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/queries";
import { redeemAdminPass } from "@/lib/admin-pass";

/**
 * The admin panel (find-me-admin) calls this right after it changes anything the public pages show
 * (bans, hiding, badges, pro side, reviews, phone verification), so search and profiles update at
 * once instead of when the cache runs out. Needs a one-time admin pass (see lib/admin-pass.ts).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { pass?: unknown } | null;
  if (!(await redeemAdminPass(body?.pass))) return new Response(null, { status: 401 });
  // expire: 0 = never serve the old copy; the next visit reads fresh data.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
