import { NextResponse, type NextRequest } from 'next/server'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value)
  }

  if (request.nextUrl.protocol === 'https:' || process.env.PUBLIC_BASE_URL?.startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)'],
}
