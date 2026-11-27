import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";

/**
 * missed_searches/{hash}: a search that found no professionals. One document per distinct
 * search (words + category + state), counted up each time, so the admin numbers page can show
 * which skills and places to recruit pros for. Holds no user details.
 */
export type MissedSearchDoc = { q: string; category: string; state: string; count: number; lastAt: number };

export async function logMissedSearch(s: { q?: string; category?: string; state?: string }) {
  const q = (s.q ?? "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  const category = s.category ?? "";
  const state = s.state ?? "";
  if (!q && !category && !state) return;
  const id = createHash("sha1").update(`${q}|${category}|${state}`).digest("hex").slice(0, 24);
  const now = Date.now();
  await db()
    .collection("missed_searches")
    .doc(id)
    .set({ q, category, state, count: FieldValue.increment(1), lastAt: now }, { merge: true });
}
