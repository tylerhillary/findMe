import "server-only";
import { connection } from "next/server";
import { db } from "./firebase-admin";
import { photoUrl } from "./photos";

/** A photo of a pro's work, stored in Firestore as a small JPEG data URL (works/{id}). */
export type WorkDoc = { userId: string; image: string; caption: string; createdAt: number };
export type WorkPhoto = { id: string; url: string; caption: string };

/** A pro's work photos, newest first. */
export async function getWorkPhotos(userId: string): Promise<WorkPhoto[]> {
  await connection();
  const snap = await db().collection("works").where("userId", "==", userId).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as WorkDoc) }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((w) => ({ id: w.id, url: photoUrl("work", w.id, w.image)!, caption: w.caption }))
    .filter((w) => !!w.url);
}
