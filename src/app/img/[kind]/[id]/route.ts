import { db } from "@/lib/firebase-admin";

/**
 * GET /img/avatar/<userId>?v=… or /img/cover/<userId>?v=…: the stored photo as a real image.
 * Addresses carry a version (see lib/photos.ts), so each one is cached for a year.
 */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await ctx.params;
  if ((kind !== "avatar" && kind !== "cover") || !id || id.length > 128 || id.includes("/")) return new Response(null, { status: 404 });

  const snap = kind === "avatar" ? await db().collection("users").doc(id).get() : await db().collection("covers").doc(id).get();
  const data = snap.get(kind === "avatar" ? "avatar" : "image") as string | undefined;
  const m = data?.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });

  const versioned = new URL(req.url).searchParams.has("v");
  return new Response(Buffer.from(m[2], "base64"), {
    headers: {
      "Content-Type": m[1],
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
