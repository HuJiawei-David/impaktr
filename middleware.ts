import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/signup',
      '/api/auth',
      '/api/auth/register',
      '/pricing',
      '/about',
      '/contact',
      '/terms',
      '/privacy',
      '/features'
    ]

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route) || pathname === route
    )

    // Allow access to public routes
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users to signup for protected routes
    if (!token) {
      const signupUrl = new URL('/signup', req.url)
      signupUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signupUrl)
    }

    // Handle profile setup redirect for OAuth users without complete profiles
    if (pathname !== '/profile-setup' && token && !token.profileComplete) {
      return NextResponse.redirect(new URL('/profile-setup', req.url))
    }

    // Role-based access control
    const userType = token.userType as string

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (userType !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Organization-specific routes
    if (pathname.startsWith('/organizations/') && pathname.includes('/manage')) {
      if (!['NGO', 'CORPORATE', 'SCHOOL', 'HEALTHCARE'].includes(userType)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Corporate-specific routes
    if (pathname.startsWith('/corporate')) {
      if (userType !== 'CORPORATE') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // NGO-specific routes
    if (pathname.startsWith('/ngo')) {
      if (userType !== 'NGO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow access to public routes and API routes
        if (pathname.startsWith('/api/auth') || 
            pathname === '/' || 
            pathname === '/signup' ||
            pathname === '/pricing' ||
            pathname.startsWith('/api/auth/register')) {
          return true
        }

        // For all other routes, require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/signup', // Redirect to signup instead of default sign-in
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
