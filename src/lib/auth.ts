import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminAuth, db } from "./firebase-admin";

export const SESSION_COOKIE = "findme_session";
// Firebase session cookies can last at most 14 days.
const SESSION_MS = 14 * 86_400_000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "client" | "provider";
  avatar: string | null;
  headline: string;
};

/** Exchange a fresh Firebase ID token (from the browser sign-in) for an httpOnly session cookie. */
export async function createSession(idToken: string) {
  const decoded = await adminAuth().verifyIdToken(idToken);
  // Only accept tokens from a sign-in that just happened.
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) throw new Error("stale-login");
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MS });
  (await cookies()).set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  return decoded.uid;
}

export async function destroySession() {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  if (cookie) {
    try {
      const { uid } = await adminAuth().verifySessionCookie(cookie);
      // Sign out everywhere this session was used.
      await adminAuth().revokeRefreshTokens(uid);
    } catch {
      // Already expired or invalid — nothing to revoke.
    }
  }
}

/** Just the signed-in user's id (no profile read). For frequent, cheap calls like chat polling. */
export async function getSessionUid(): Promise<string | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    return (await adminAuth().verifySessionCookie(cookie)).uid;
  } catch {
    return null;
  }
}

/** The signed-in user, or null. Reads the request cookie, so call it inside a Suspense boundary. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  // Verifying the cookie checks its expiry against the clock, so it must run at request time.
  await connection();
  let uid: string;
  try {
    uid = (await adminAuth().verifySessionCookie(cookie)).uid;
  } catch (e) {
    console.warn("[findMe] session cookie rejected:", (e as { code?: string }).code ?? e);
    return null; // expired, revoked or tampered
  }
  const snap = await db().collection("users").doc(uid).get();
  const u = snap.data();
  if (!u) {
    console.warn("[findMe] signed-in user has no profile:", uid);
    return null;
  }
  if (u.banned) return null; // banned by an admin
  return {
    id: uid,
    name: u.name,
    email: u.email,
    role: u.role === "provider" ? "provider" : "client",
    avatar: u.avatar ?? null,
    headline: u.headline ?? "",
  };
});

/** The signed-in user's email and whether it's confirmed (read live from Firebase Auth). */
export const getEmailStatus = cache(async (uid: string) => {
  try {
    const u = await adminAuth().getUser(uid);
    const verified = !!u.emailVerified;
    // Confirming happens by email link while signed in, so copy the flag onto the profile here too
    // (public pages read it from there). Only writes when it actually changed.
    const ref = db().collection("users").doc(uid);
    const stored = (await ref.get()).get("emailVerified");
    if (!!stored !== verified) await ref.update({ emailVerified: verified }).catch(() => {});
    return { email: u.email ?? "", verified };
  } catch {
    return { email: "", verified: false };
  }
});

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    // Default: the page they were opening (set by proxy.ts), e.g. a conversation linked from an email.
    const path = next ?? (await headers()).get("x-findme-path") ?? "/dashboard";
    redirect(`/login?next=${encodeURIComponent(path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard")}`);
  }
  return user;
}
