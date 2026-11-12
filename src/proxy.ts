import { NextResponse, type NextRequest } from "next/server";

// Auth.js names its session cookie differently on HTTPS and on plain HTTP.
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

/**
 * Sends a request with no session cookie away from protected pages with a real
 * HTTP redirect, before anything is rendered. Those pages stream a loading
 * skeleton, so without this the redirect would arrive inside a 200 response.
 *
 * This is only a fast path. It does not validate the cookie: every protected
 * page and action still checks the session against the database
 * (`requireUserId`), and that check is what protects the data.
 */
export function proxy(request: NextRequest) {
  if (SESSION_COOKIES.some((name) => request.cookies.has(name))) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/assessment/:path*", "/chat/:path*", "/profile/:path*"],
};
