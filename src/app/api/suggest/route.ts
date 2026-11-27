import { getSkillVocabulary } from "@/lib/queries";
import { suggest } from "@/lib/professions";

/** GET /api/suggest?q=plu → professions, categories and skills closest to what's been typed. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  const skills = await getSkillVocabulary().catch(() => []);
  return Response.json({ suggestions: suggest(q, skills) }, { headers: { "Cache-Control": "public, max-age=60" } });
}
