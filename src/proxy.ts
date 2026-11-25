import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate: bounce visitors without a session cookie before rendering.
// The real session check happens on the server in requireUser().
export function proxy(request: NextRequest) {
  if (!request.cookies.has("findme_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  // Tell the page where the visitor was headed, so an expired session can send them back here.
  const headers = new Headers(request.headers);
  headers.set("x-findme-path", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/dashboard/:path*",
};
