import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname

  // Do not redirect if we are already on a login page
  if (path === '/teacher/login' || path === '/student/login') {
    return NextResponse.next()
  }

  // Teacher route protection
  if (path.startsWith('/teacher')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/teacher/login?callbackUrl=${encodeURIComponent(req.nextUrl.href)}`, req.nextUrl))
    }
  }

  // Student route protection
  if (path.startsWith('/student')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/student/login?callbackUrl=${encodeURIComponent(req.nextUrl.href)}`, req.nextUrl))
    }
  }

  return NextResponse.next()
})

// Specify the paths where the middleware should run
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}
