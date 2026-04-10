import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
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

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  const auth = authenticate(request)
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const agencyDb = await getAgencyDb()

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
      ORDER BY o.seller_agency_member_id ASC
    `
  }

  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query)
    logApiRequest('GET', '/api/reports/commission-plus/sellers', 200, apiKey)
    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/commission-plus/sellers', 500, apiKey, error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
