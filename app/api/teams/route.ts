import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/teams
 * Returns distinct team_number values from
 * twp_agencies_db_views.v_6kMWFc_agcy_agency_members where job_position is
 * not null.
 *
 * Ported from be-2-report:
 *   - controller: user-management.controller.ts · getTeams
 *   - query-builder: user-management-query-builder.ts · buildGetTeamsQuery
 *
 * Response: raw array of { team_number: number }.
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
      SELECT DISTINCT team_number
      FROM twp_agencies_db_views.v_6kMWFc_agcy_agency_members
      WHERE job_position IS NOT NULL
        AND team_number IS NOT NULL
      ORDER BY team_number ASC
    `

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql)

    const teams = rows.map((row) => ({
      team_number: Number(row.team_number)
    }))

    return NextResponse.json(teams)
  } catch (error: any) {
    console.error('[GET /api/teams] error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve teams', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
