import { NextRequest, NextResponse } from 'next/server'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate, requireRole, AuthContext, Role } from '@/lib/auth'

/**
 * Wraps a route handler with the standard rate-limit + JWT/API-key
 * authentication + structured-logging chrome that every report route
 * needs. The handler only runs after both gates pass; rate-limit + auth
 * failures short-circuit with the canonical 429 / 401 responses (and
 * are logged automatically).
 *
 * Errors thrown by the handler are caught and returned as 500 with a
 * standard error shape so individual routes don't need their own
 * try/catch around the entire body.
 *
 * Usage:
 *   export const GET = withApiGuard('/api/reports/foo', async (request) => {
 *     const { searchParams } = new URL(request.url)
 *     // ... query mysql, build response ...
 *     return NextResponse.json({ success: true, data })
 *   })
 *
 * Rate-limit defaults match the legacy inline boilerplate (100 req / 60s
 * per api-key / IP). Pass `options` to override per-route.
 */
export interface ApiGuardOptions {
  rateLimit?: { max: number; windowMs: number }
  /**
   * Restrict the route to specific roles. Omit to allow any authenticated
   * caller (admin/ts/crm). API-key authenticated requests bypass this check
   * (treated as service callers — admin equivalent).
   */
  roles?: Role[]
}

const DEFAULT_RATE_LIMIT = { max: 100, windowMs: 60_000 }

export type GuardedHandler = (
  request: NextRequest,
  auth: AuthContext
) => Promise<Response> | Response

export function withApiGuard(
  routeName: string,
  handler: GuardedHandler,
  options: ApiGuardOptions = {}
) {
  const limit = options.rateLimit ?? DEFAULT_RATE_LIMIT
  const allowedRoles = options.roles

  return async function guardedHandler(request: NextRequest): Promise<Response> {
    const method = request.method || 'GET'
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Rate limit — keyed off the api key when present, falling back to IP
    // so anonymous spam still gets capped.
    const rl = checkRateLimit(apiKey || clientIp, limit.max, limit.windowMs)
    if (!rl.allowed) {
      logApiRequest(method, routeName, 429, apiKey, 'Rate limit exceeded')
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Try again later.',
          retryAfter: Math.ceil((rl.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    // Authentication — JWT (Authorization: Bearer) or API key (x-api-key).
    // The two header paths are now strictly separated (story 002).
    const authResult = authenticate(request)
    if (!authResult.authenticated) {
      logApiRequest(method, routeName, 401, apiKey, authResult.error || 'Authentication failed')
      return NextResponse.json(
        { success: false, error: 'Unauthorized - ' + (authResult.error || 'Invalid token or API key') },
        { status: 401 }
      )
    }

    // Role gate. API-key callers (no JWT payload) are treated as admin —
    // they're trusted service-to-service callers vetted at the env-var level.
    const jwtPayload = authResult.method === 'jwt' ? authResult.user ?? null : null
    const guard = requireRole(allowedRoles ?? ['admin', 'ts', 'crm'], request, jwtPayload)
    if (!guard.ok) {
      logApiRequest(method, routeName, 403, apiKey, 'Forbidden')
      return guard.response
    }

    try {
      const response = await handler(request, guard.auth)
      // Echo the effective role so the frontend banner reflects the server's
      // actual decision, not local sessionStorage (TEA risk R-06 mitigation).
      // Don't overwrite if the handler already set it.
      if (!response.headers.get('X-Effective-Role')) {
        response.headers.set('X-Effective-Role', guard.auth.effectiveRole)
      }
      logApiRequest(method, routeName, response.status || 200, apiKey)
      return response
    } catch (error: any) {
      const message = error?.message ?? 'Unknown error'
      logApiRequest(method, routeName, 500, apiKey, message)
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    }
  }
}
