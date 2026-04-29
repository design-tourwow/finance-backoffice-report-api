import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate, requireRole } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/agency-members
 *
 * Returns all agency members that have a job_position assigned.
 * This is the port of be-2-report's `GET /api/users` endpoint; renamed here
 * because this repo already exposes a different `/api/users` route (Supabase
 * chat users).
 *
 * The frontend (Phase 2) should be updated to call this path instead of
 * `/api/users`.
 *
 * Ported from be-2-report:
 *   - controller: user-management.controller.ts · getUsers
 *   - query-builder: user-management-query-builder.ts · buildGetUsersQuery
 *
 * Response: raw array of
 *   { ID, user_id, first_name, last_name, nickname, job_position, team_number }
 */
export async function GET(request: NextRequest) {
  const auth = authenticate(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: auth.error ?? 'Invalid token' },
      { status: 401 }
    )
  }

  const jwtPayload = auth.method === 'jwt' ? auth.user ?? null : null
  const guard = requireRole(['admin', 'ts', 'crm'], request, jwtPayload)
  if (!guard.ok) return guard.response

  try {
    // Optional ?roles=ts,crm filter — restricts to specific job_position
    // values. Lets seller-style filters on report pages avoid pulling the
    // entire agency-members list when only TS/CRM rows are needed.
    const { searchParams } = new URL(request.url)
    const rolesParam = (searchParams.get('roles') || '').trim()
    const roles = rolesParam
      ? rolesParam.split(',').map(r => r.trim().toLowerCase()).filter(Boolean)
      : []

    const params: any[] = []
    let roleClause = ''
    if (roles.length > 0) {
      const placeholders = roles.map(() => '?').join(',')
      roleClause = `AND LOWER(job_position) IN (${placeholders})`
      params.push(...roles)
    }

    const sql = `
      SELECT
        id,
        users_id,
        first_name,
        last_name,
        nick_name AS nickname,
        job_position,
        team_number
      FROM twp_agencies_db_views.v_6kMWFc_agcy_agency_members
      WHERE job_position IS NOT NULL
        AND TRIM(job_position) != ''
        ${roleClause}
      ORDER BY team_number ASC, job_position ASC, first_name ASC
    `

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params)

    const users = rows.map((row) => ({
      ID: row.id,
      user_id: row.users_id != null ? String(row.users_id) : '',
      first_name: row.first_name ?? '',
      last_name: row.last_name ?? '',
      nickname: row.nickname ?? '',
      job_position: row.job_position ?? '',
      team_number: row.team_number ?? 0
    }))

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('[GET /api/agency-members] error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve agency members', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
