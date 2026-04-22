import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
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

  try {
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
      ORDER BY team_number ASC, job_position ASC, first_name ASC
    `

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql)

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
