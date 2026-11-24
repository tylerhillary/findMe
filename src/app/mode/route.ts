import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MODE_COOKIE, MODE_COOKIE_OPTIONS } from "@/lib/mode";

/**
 * Switches the dashboard between hiring and working: /mode?to=hire or /mode?to=work.
 * - Signed out: "work" goes to sign-up as a pro, "hire" to sign-in.
 * - No pro profile yet: "work" opens the pro profile setup instead of a second sign-up.
 */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") === "work" ? "work" : "hire";
  const url = (path: string) => new URL(path, request.url);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(url(to === "work" ? "/register?role=provider" : "/login?next=%2Fdashboard"));
  }

  const dest = to === "work" && user.role !== "provider" ? "/dashboard/profile?setup=1" : "/dashboard";
  const res = NextResponse.redirect(url(dest));
  res.cookies.set(MODE_COOKIE, to, MODE_COOKIE_OPTIONS);
  return res;
}
