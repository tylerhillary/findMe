import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate: bounce visitors without a session cookie before rendering.
// The real session check happens on the server in requireUser().
export function proxy(request: NextRequest) {
  if (!request.cookies.has("findme_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
