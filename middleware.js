import { NextResponse } from 'next/server'

// Allowed origins list
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://staging-finance-backoffice-report.vercel.app',
  'https://finance-backoffice-report.vercel.app'
]

export function middleware(request) {
  const origin = request.headers.get('origin')
  
  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 200 })
    
    // Only set CORS headers if origin is in whitelist
    if (origin && allowedOrigins.includes(origin)) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin)
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    preflightResponse.headers.set('Access-Control-Allow-Headers', 'authorization, x-api-key, Content-Type, Accept, X-Requested-With')
    preflightResponse.headers.set('Access-Control-Max-Age', '86400')
    
    return preflightResponse
  }

  // Handle actual requests
  const response = NextResponse.next()
  
  // Only set CORS headers if origin is in whitelist
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

// Apply middleware to API routes only
export const config = {
  matcher: '/api/:path*'
}
