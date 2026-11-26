import { askProAboutOffer } from "@/lib/broker";
import { redeemAdminPass } from "@/lib/admin-pass";

/**
 * The admin panel asks a pro about a client's offer from here, so the pro gets the same bell
 * notification and email as when the site asks them. Needs a one-time admin pass.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { pass?: unknown; jobId?: unknown; proId?: unknown } | null;
  if (!(await redeemAdminPass(body?.pass))) return new Response(null, { status: 401 });
  const jobId = String(body?.jobId ?? "").slice(0, 128);
  const proId = String(body?.proId ?? "").slice(0, 128);
  if (!jobId || !proId) return Response.json({ ok: false }, { status: 400 });
  const ok = await askProAboutOffer(jobId, proId);
  return Response.json({ ok }, { status: ok ? 200 : 409 });
}
