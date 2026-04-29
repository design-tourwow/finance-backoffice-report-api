import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { withApiGuard } from '@/lib/api-guard'
import { RowDataPacket } from 'mysql2'

async function getAgencyDb(): Promise<string | null> {
  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_NAME = 'v_6kMWFc_agcy_agency_members' LIMIT 1`
    )
    return rows[0]?.TABLE_SCHEMA ?? null
  } catch {
    return null
  }
}

export const GET = withApiGuard('/api/reports/commission-plus/sellers', async (request, auth) => {
  const agencyDb = await getAgencyDb()

  // ts/crm only see themselves in the seller dropdown — admin sees the full list.
  const sellerScopeClause = auth.effectiveRole === 'admin'
    ? ''
    : 'AND o.seller_agency_member_id = ?'
  const queryParams: any[] = auth.effectiveRole === 'admin' ? [] : [auth.effectiveUserId]

  let query: string
  if (agencyDb) {
    const amTable = `\`${agencyDb}\`.v_6kMWFc_agcy_agency_members`
    query = `
      SELECT DISTINCT
        o.seller_agency_member_id AS id,
        COALESCE(am.nick_name, CAST(o.seller_agency_member_id AS CHAR)) AS nick_name,
        COALESCE(am.first_name, '') AS first_name,
        COALESCE(am.last_name, '')  AS last_name,
        COALESCE(am.job_position, '') AS job_position
      FROM v_Xqc7k7_orders o
      LEFT JOIN ${amTable} am ON am.id = o.seller_agency_member_id
      WHERE o.seller_agency_member_id IS NOT NULL
        ${sellerScopeClause}
      ORDER BY nick_name ASC
    `
  } else {
    // Fallback: return distinct IDs only (no name lookup)
    query = `
      SELECT DISTINCT
        o.seller_agency_member_id AS id,
        CAST(o.seller_agency_member_id AS CHAR) AS nick_name,
        '' AS first_name,
        '' AS last_name,
        '' AS job_position
      FROM v_Xqc7k7_orders o
      WHERE o.seller_agency_member_id IS NOT NULL
        ${sellerScopeClause}
      ORDER BY o.seller_agency_member_id ASC
    `
  }

  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, queryParams)
    return NextResponse.json(
      { success: true, data: rows },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}, { roles: ['admin', 'ts', 'crm'] })
