import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/job-positions
 * Returns distinct non-empty job_position values from
 * twp_agencies_db_views.v_6kMWFc_agcy_agency_members.
 *
 * Ported from be-2-report:
 *   - controller: user-management.controller.ts · getJobPositions
 *   - query-builder: user-management-query-builder.ts · buildGetJobPositionsQuery
 *
 * Response: raw array of { job_position: string }.
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
      SELECT DISTINCT job_position
      FROM twp_agencies_db_views.v_6kMWFc_agcy_agency_members
      WHERE job_position IS NOT NULL
        AND TRIM(job_position) != ''
      ORDER BY job_position ASC
    `

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql)

    const jobPositions = rows.map((row) => ({
      job_position: row.job_position as string
    }))

    return NextResponse.json(jobPositions)
  } catch (error: any) {
    console.error('[GET /api/job-positions] error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve job positions', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
