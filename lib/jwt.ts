import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// JWT Secret Key for HS256 verification
// Token from Finance Backoffice is signed with this key
const JWT_SECRET = process.env.JWT_SECRET || 'pRAe68l7ZW8S+3ZIph3qcxFIIaaZeY+SSQ3wwRIrbAg='

// JWT Payload interface - adjust based on actual token structure from Finance Backoffice
export interface JWTPayload {
  sub?: string           // Subject (user ID)
  username?: string      // Username
  email?: string         // Email
  role?: string          // User role
  iat?: number           // Issued at
  exp?: number           // Expiration time
  [key: string]: unknown // Allow additional fields
}

/**
 * Verify JWT token from request headers
 * Supports both 'authorization' and 'x-api-key' headers
 *
 * @param request - NextRequest object
 * @returns Decoded JWT payload if valid, null if invalid
 */
export function verifyJWT(request: NextRequest): JWTPayload | null {
  // Get token from headers (support both authorization and x-api-key)
  const authHeader = request.headers.get('authorization')
  const apiKeyHeader = request.headers.get('x-api-key')

  let token: string | null = null

  // Check authorization header first (Bearer token)
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    } else {
      token = authHeader // Use as-is if no Bearer prefix
    }
  }
  // Fallback to x-api-key header
  else if (apiKeyHeader) {
    token = apiKeyHeader
  }

  if (!token) {
    console.log('[JWT] No token provided in headers')
    return null
  }

  try {
    // Verify token with HS256 algorithm
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as JWTPayload

    console.log('[JWT] Token verified successfully for user:', decoded.username || decoded.sub || 'unknown')
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[JWT] Token expired at:', error.expiredAt)
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('[JWT] Invalid token:', error.message)
    } else {
      console.log('[JWT] Token verification failed:', error)
    }
    return null
  }
}

/**
 * Verify JWT token string directly
 *
 * @param token - JWT token string
 * @returns Decoded JWT payload if valid, null if invalid
 */
export function verifyJWTToken(token: string): JWTPayload | null {
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as JWTPayload

    return decoded
  } catch (error) {
    console.log('[JWT] Token verification failed:', error)
    return null
  }
}

/**
 * Decode JWT token without verification (for debugging only)
 * WARNING: Do not use this for authentication - always use verifyJWT
 *
 * @param token - JWT token string
 * @returns Decoded payload without verification
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Return unauthorized response for JWT failures
 */
export function jwtUnauthorizedResponse(message?: string) {
  return Response.json(
    {
      success: false,
      error: 'Unauthorized',
      message: message || 'Valid JWT token is required. Please include a valid token in the authorization header.'
    },
    { status: 401 }
  )
}

/**
 * Check if JWT verification is enabled
 * Can be controlled via environment variable
 */
export function isJWTEnabled(): boolean {
  return process.env.REQUIRE_JWT !== 'false'
}
