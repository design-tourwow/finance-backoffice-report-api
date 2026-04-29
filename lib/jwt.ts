import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// JWT Secret Key for HS256 verification
// Token from Finance Backoffice is signed with this key.
// Fail fast on boot if missing — prevents silent acceptance of forged tokens.
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set')
}
const JWT_SECRET: string = process.env.JWT_SECRET

// JWT Payload interface based on actual Finance Backoffice token structure.
// IMPORTANT: role decisions MUST use `user.agency_member.job_position`.
// Do NOT use `roles_slug` for authorization — the two fields can disagree
// (a user may have roles_slug=admin but job_position=ts), and the rest of
// the system (frontend menu, requireRole) treats job_position as truth.
export interface AgencyMember {
  id: number
  job_position?: string  // 'admin' | 'ts' | 'crm' — source of truth for RBAC
  roles_slug?: string    // legacy / unrelated to RBAC — do NOT use for auth
  team?: number
  first_name?: string
  last_name?: string
  nick_name?: string
  mobile_number?: string
}

export interface JWTUser {
  agency?: { id: number }
  agency_config?: { id: number }
  agency_member?: AgencyMember
}

export interface JWTPayload {
  iss?: string           // Issuer (e.g. 'tourwow')
  aud?: string           // Audience
  sub?: string           // Subject (user ID)
  iat?: number           // Issued at
  exp?: number           // Expiration time
  user?: JWTUser         // Finance Backoffice payload wrapper
  [key: string]: unknown // Allow additional fields
}

/**
 * Verify JWT token from request headers.
 * STRICT: only reads `Authorization: Bearer <token>`. Does not fall back to x-api-key.
 *
 * @param request - NextRequest object
 * @returns Decoded JWT payload if valid, null if invalid
 */
export function verifyJWT(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[JWT] No Bearer token provided')
    return null
  }

  const token = authHeader.substring(7)

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
