import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

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

  // Return agency members who have at least one order
  const query = `
    SELECT DISTINCT
      am.id,
      COALESCE(am.nick_name, '') AS nick_name,
      COALESCE(am.first_name, '') AS first_name,
      COALESCE(am.last_name, '') AS last_name
    FROM v_6kMWFc_agcy_agency_members am
    INNER JOIN v_Xqc7k7_orders o ON o.seller_agency_member_id = am.id
    ORDER BY am.nick_name ASC
  `

  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query)
    logApiRequest('GET', '/api/reports/commission-plus/sellers', 200, apiKey)
    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/commission-plus/sellers', 500, apiKey, error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
