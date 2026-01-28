import { NextRequest } from 'next/server'
import { verifyJWT, jwtUnauthorizedResponse, isJWTEnabled, JWTPayload } from './jwt'

// API Keys - ในการใช้งานจริงควรเก็บใน Database
// Test keys for demonstration
const VALID_API_KEYS = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e', // Test key 1
  'sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d', // Test key 2
])

/**
 * Validate API Key from request headers
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return false
  }

  return VALID_API_KEYS.has(apiKey)
}

/**
 * Authentication result with user info from JWT
 */
export interface AuthResult {
  authenticated: boolean
  method: 'jwt' | 'api_key' | 'none'
  user?: JWTPayload
  error?: string
}

/**
 * Unified authentication - supports both JWT and API Key
 * Priority: JWT first, then API Key fallback
 *
 * @param request - NextRequest object
 * @returns AuthResult with authentication status and user info
 */
export function authenticate(request: NextRequest): AuthResult {
  // Check if JWT is enabled
  if (isJWTEnabled()) {
    // Try JWT verification first
    const jwtPayload = verifyJWT(request)

    if (jwtPayload) {
      return {
        authenticated: true,
        method: 'jwt',
        user: jwtPayload
      }
    }

    // JWT is required but not valid
    console.log('[Auth] JWT verification failed, checking if API key fallback is allowed')

    // If REQUIRE_API_KEY is also true, try API key as fallback
    if (process.env.REQUIRE_API_KEY === 'true') {
      if (validateApiKey(request)) {
        console.log('[Auth] API Key validated as fallback')
        return {
          authenticated: true,
          method: 'api_key'
        }
      }
    }

    return {
      authenticated: false,
      method: 'none',
      error: 'Invalid or missing JWT token'
    }
  }

  // JWT not enabled, use API Key only
  if (process.env.REQUIRE_API_KEY === 'true') {
    if (validateApiKey(request)) {
      return {
        authenticated: true,
        method: 'api_key'
      }
    }
    return {
      authenticated: false,
      method: 'none',
      error: 'Invalid or missing API key'
    }
  }

  // No authentication required
  return {
    authenticated: true,
    method: 'none'
  }
}

/**
 * Simple authentication check (backward compatible)
 * Returns true if authenticated via JWT or API Key
 */
export function isAuthenticated(request: NextRequest): boolean {
  return authenticate(request).authenticated
}

export function unauthorizedResponse() {
  return Response.json(
    {
      success: false,
      error: 'Unauthorized',
      message: 'Valid API key is required. Please include x-api-key header.'
    },
    { status: 401 }
  )
}

// Re-export JWT unauthorized response for convenience
export { jwtUnauthorizedResponse }
