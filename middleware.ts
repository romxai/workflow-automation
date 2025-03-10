import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Debug helper
const debug = (message: string, data?: any) => {
  //console.log(`[Middleware] ${message}`, data ? data : "");
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  //debug("Middleware processing request", { pathname });

  // Check if the path is a protected route
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/workflow") ||
    pathname === "/user-settings";

  // Check if the path is an auth route
  const isAuthRoute =
    pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");

  //debug("Route classification", { isProtectedRoute, isAuthRoute });

  try {
    // Get the token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    //debug("Auth token status", { hasToken: !!token });

    // Redirect to login if accessing a protected route without being authenticated
    if (isProtectedRoute && !token) {
      //debug("Unauthorized access to protected route, redirecting to login", {
      //  pathname,
      //});
      const url = new URL("/auth/login", request.url);
      url.searchParams.set("callbackUrl", encodeURI(pathname));
      return NextResponse.redirect(url);
    }

    // Redirect to dashboard if accessing auth routes while authenticated
    if (isAuthRoute && token) {
      //debug(
      //  "Authenticated user accessing auth route, redirecting to dashboard"
      //);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    //debug("Middleware allowing request to proceed");
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, allow the request to proceed
    // This prevents authentication errors from blocking the entire site
    return NextResponse.next();
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workflow/:path*",
    "/user-settings",
    "/auth/login",
    "/auth/signup",
  ],
};
