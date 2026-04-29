import { NextRequest } from 'next/server'
import { verifyJWT, jwtUnauthorizedResponse, isJWTEnabled, JWTPayload } from './jwt'

// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control (RBAC)
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'ts' | 'crm'

const ROLES: ReadonlySet<Role> = new Set(['admin', 'ts', 'crm'] as const)

// View-as is restricted to a single admin user. Reads from env so the id can
// be rotated without a code deploy; defaults to 555 (the only authorized
// tester at the time of writing).
const VIEW_AS_ADMIN_ID: number = (() => {
  const raw = process.env.VIEW_AS_ADMIN_ID
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 555
})()

export interface AuthContext {
  effectiveRole: Role
  effectiveUserId: number
  realRole: Role
  realUserId: number
  isImpersonating: boolean
}

export type RoleGuardResult =
  | { ok: true;  auth: AuthContext }
  | { ok: false; response: Response }

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.has(value as Role)
}

/**
 * Resolve the user's real role from JWT payload.
 * Source of truth: `user.agency_member.job_position`. NEVER use `roles_slug`.
 * Falls back to 'admin' for unknown values or missing agency_member —
 * matches frontend `getCurrentUserRole()` in menu-component.js.
 */
export function getRealRole(payload: JWTPayload | null | undefined): Role {
  const jp = payload?.user?.agency_member?.job_position
  if (typeof jp === 'string') {
    const lower = jp.toLowerCase()
    if (isRole(lower)) return lower
  }
  return 'admin'
}

function getRealUserId(payload: JWTPayload | null | undefined): number {
  const id = payload?.user?.agency_member?.id
  return typeof id === 'number' && Number.isFinite(id) ? id : 0
}

/**
 * Resolve the effective role for this request.
 * Honors `X-View-As-Role` ONLY when the real caller is admin AND
 * agency_member.id matches VIEW_AS_ADMIN_ID. Any other caller's
 * view-as headers are silently ignored.
 *
 * Valid view-as roles: 'ts', 'crm'. Self-impersonation as 'admin' is rejected.
 * Both X-View-As-Role and X-View-As-User-Id must be present together.
 */
export function getEffectiveRole(request: NextRequest, payload: JWTPayload | null | undefined): Role {
  const realRole = getRealRole(payload)
  const realId = getRealUserId(payload)

  if (realRole !== 'admin' || realId !== VIEW_AS_ADMIN_ID) return realRole

  const viewAsRole = request.headers.get('x-view-as-role')
  const viewAsUserId = request.headers.get('x-view-as-user-id')

  if (!viewAsRole && !viewAsUserId) return realRole

  if (!viewAsRole || !viewAsUserId) {
    console.warn('[ViewAs] Both X-View-As-Role and X-View-As-User-Id required; ignoring partial impersonation headers')
    return realRole
  }

  const lower = viewAsRole.toLowerCase()
  if (lower === 'admin') {
    console.warn('[ViewAs] Self-impersonation as admin rejected')
    return realRole
  }

  if (!isRole(lower)) {
    console.warn(`[ViewAs] Unknown role "${viewAsRole}"; ignoring`)
    return realRole
  }

  const targetId = Number.parseInt(viewAsUserId, 10)
  if (!Number.isFinite(targetId) || targetId <= 0) {
    console.warn(`[ViewAs] Invalid user id "${viewAsUserId}"; ignoring`)
    return realRole
  }

  console.log(`[ViewAs] Admin id=${realId} impersonating role=${lower} userId=${targetId}`)
  return lower
}

/**
 * Resolve the effective user id (used for SQL data filters).
 * When impersonation is active and authorized, returns the target user id;
 * otherwise returns the real user id from the JWT.
 */
export function getEffectiveUserId(request: NextRequest, payload: JWTPayload | null | undefined): number {
  const realRole = getRealRole(payload)
  const realId = getRealUserId(payload)

  if (realRole !== 'admin' || realId !== VIEW_AS_ADMIN_ID) return realId

  const viewAsRole = request.headers.get('x-view-as-role')
  const viewAsUserId = request.headers.get('x-view-as-user-id')

  if (!viewAsRole || !viewAsUserId) return realId

  const lower = viewAsRole.toLowerCase()
  if (lower === 'admin' || !isRole(lower)) return realId

  const targetId = Number.parseInt(viewAsUserId, 10)
  if (!Number.isFinite(targetId) || targetId <= 0) return realId

  return targetId
}

/**
 * Gate a route by role. Call after verifyJWT(request) at the top of the handler.
 * - Pass `payload=null` for routes authenticated via API key (service caller is
 *   treated as admin).
 * - Returns { ok: true, auth } for callers in `allowed`.
 * - Returns { ok: false, response: 403 } otherwise. The 403 response includes
 *   the X-Effective-Role header for tester visibility (TEA risk R-06).
 *
 * Successful handlers MUST also attach `X-Effective-Role` to their 200 response
 * so the frontend banner reflects the server's actual decision, not local state.
 */
export function requireRole(
  allowed: Role[],
  request: NextRequest,
  payload: JWTPayload | null
): RoleGuardResult {
  if (payload === null) {
    return {
      ok: true,
      auth: {
        effectiveRole: 'admin',
        effectiveUserId: 0,
        realRole: 'admin',
        realUserId: 0,
        isImpersonating: false,
      },
    }
  }

  const realRole = getRealRole(payload)
  const realUserId = getRealUserId(payload)
  const effectiveRole = getEffectiveRole(request, payload)
  const effectiveUserId = getEffectiveUserId(request, payload)

  if (!allowed.includes(effectiveRole)) {
    return {
      ok: false,
      response: Response.json(
        {
          success: false,
          error: 'Forbidden',
          required_roles: allowed,
          your_role: effectiveRole,
        },
        {
          status: 403,
          headers: { 'X-Effective-Role': effectiveRole },
        }
      ),
    }
  }

  return {
    ok: true,
    auth: {
      effectiveRole,
      effectiveUserId,
      realRole,
      realUserId,
      isImpersonating: effectiveRole !== realRole || effectiveUserId !== realUserId,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Key validation
// ─────────────────────────────────────────────────────────────────────────────

// API Keys - เก็บใน Vercel Environment Variables เท่านั้น
const VALID_API_KEYS = new Set([
  process.env.API_KEY_PRODUCTION,
  process.env.API_KEY_STAGING,
].filter(Boolean))

/**
 * Validate API Key from request headers.
 * STRICT: only reads `x-api-key`. Does not fall back to Authorization: Bearer —
 * Bearer is reserved for JWT only.
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')

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
