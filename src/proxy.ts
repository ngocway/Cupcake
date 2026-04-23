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

  // Admin route protection
  if (path.startsWith('/admin')) {
    if (path === '/admin/login') {
      return NextResponse.next()
    }

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${encodeURIComponent(req.nextUrl.href)}`, req.nextUrl))
    }

    const userRole = req.auth?.user?.role
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }

  // Teacher route protection
  if (path.startsWith('/teacher')) {
    // Allow public access to teacher profiles
    if (path.match(/\/teacher\/profile\/[a-zA-Z0-9_-]+/)) {
      return NextResponse.next();
    }

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/teacher/login?callbackUrl=${encodeURIComponent(req.nextUrl.href)}`, req.nextUrl))
    }

    // Role check for teacher
    const userRole = req.auth?.user?.role
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
       return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }


  // Student route protection
  if (path.startsWith('/student')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/student/login?callbackUrl=${encodeURIComponent(req.nextUrl.href)}`, req.nextUrl))
    }

    // Role check for student
    const userRole = req.auth?.user?.role
    if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
      // Allow teachers to access learning content
      const isLearningRoute = path.match(/\/student\/lessons\/[a-zA-Z0-9_-]+/) || 
                             path.match(/\/student\/assignments\/[a-zA-Z0-9_-]+\/run/);
      
      if (userRole === 'TEACHER') {
        if (isLearningRoute) return NextResponse.next();
        return NextResponse.redirect(new URL('/teacher/dashboard', req.nextUrl))
      }
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }

  return NextResponse.next()
})

// Specify the paths where the middleware should run
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}
