import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "./auth";

/**
 * One account can both hire and offer skills. The dashboard shows one side at a time:
 *  - "hire": requests you sent, finding talent
 *  - "work": requests you received, your services and earnings (needs a pro profile)
 * The choice is remembered per device in a cookie.
 */
export type Mode = "hire" | "work";
export const MODE_COOKIE = "findme_mode";
export const MODE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 365 * 86_400,
};

export async function getMode(user: Pick<SessionUser, "role">): Promise<Mode> {
  // Without a pro profile there's only the hiring side.
  if (user.role !== "provider") return "hire";
  return (await cookies()).get(MODE_COOKIE)?.value === "hire" ? "hire" : "work";
}
