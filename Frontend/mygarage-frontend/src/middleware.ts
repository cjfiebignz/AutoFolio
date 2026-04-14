import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route Protection Middleware
 * 
 * Manually checks for session token to protect /vehicles routes.
 * Using getToken directly instead of withAuth to prevent CLIENT_FETCH_ERROR 
 * caused by middleware intercepting auth internal requests.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect routes starting with /vehicles
  if (pathname.startsWith("/vehicles")) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      // Redirect to sign-in (home page) if no token
      const url = req.nextUrl.clone();
      url.pathname = "/";
      // Preserving any existing query params (like callbackUrl)
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = { 
  matcher: [
    "/vehicles/:path*"
  ] 
};
