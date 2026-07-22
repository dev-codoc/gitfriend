import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/chat");

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    // Remember where they were trying to go, so we can send them back
    // after a successful login.
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

// Only run this on these paths — running it on every single request
// (including static assets) would be wasteful.
export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*"],
};