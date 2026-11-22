import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { hashToken, newToken } from "./crypto";

export const SESSION_COOKIE = "findin_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "client" | "provider";
  avatar: string | null;
  headline: string;
};

export async function createSession(userId: string) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  getDb()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expires);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Reads the request cookie, so call it inside a Suspense boundary. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.headline, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CAST(strftime('%s', 'now') AS INTEGER) * 1000`
    )
    .get(hashToken(token)) as SessionUser | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    headline: row.headline,
  };
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
