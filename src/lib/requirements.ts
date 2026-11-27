/** Job requirements ("what done looks like"): one per line in forms, a list in the job. */
export const MAX_REQUIREMENTS = 12;

export function parseRequirements(text: unknown): string[] {
  const seen = new Set<string>();
  return String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim().slice(0, 200))
    .filter((l) => l.length >= 3 && !seen.has(l.toLowerCase()) && seen.add(l.toLowerCase()))
    .slice(0, MAX_REQUIREMENTS);
}
