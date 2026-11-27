/**
 * Profile photos and covers are stored in Firestore as JPEG data URLs. Putting those straight into
 * pages made every page carry them as text (twice, once in the HTML and once in the page data),
 * so pages instead get a short address, /img/<kind>/<userId>?v=<hash>, served by
 * src/app/img/[kind]/[id]/route.ts. The hash changes whenever the photo does, so the browser and
 * Vercel's CDN can keep each version for a year.
 */
export type PhotoKind = "avatar" | "cover";

/** Short, stable fingerprint of the photo (FNV-1a), so a new photo gets a new address. */
function version(data: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i += 7) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(36)}${data.length.toString(36)}`;
}

/** The address to use in <img src>, or null when there's no photo. Plain http(s) URLs pass through. */
export function photoUrl(kind: PhotoKind, userId: string, data: string | null | undefined): string | null {
  if (!data) return null;
  if (!data.startsWith("data:")) return data;
  return `/img/${kind}/${encodeURIComponent(userId)}?v=${version(data)}`;
}
