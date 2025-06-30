import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-jwt-secret-key")

// Paths that require authentication
const protectedPaths = ["/", "/editor", "/api/guides"]

// Paths that are public (guide viewer)
const publicPaths = ["/guide"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Check if path requires authentication
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path))

  if (requiresAuth) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // No token, let the AuthGuard handle it
      return NextResponse.next()
    }

    try {
      // Verify the token
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.next()
    } catch (error) {
      // Invalid token, clear it and let AuthGuard handle it
      const response = NextResponse.next()
      response.cookies.delete("auth-token")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
