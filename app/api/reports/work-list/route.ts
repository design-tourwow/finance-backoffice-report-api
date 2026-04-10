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

function formatThaiDate(dateValue?: string | null) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear() + 543
  return `${day}/${month}/${year}`
}

function formatTravelPeriod(startRaw?: string | null, endRaw?: string | null) {
  const start = formatThaiDate(startRaw)
  const end = formatThaiDate(endRaw)
  if (start === '-' && end === '-') return '-'
  if (start === '-') return end
  if (end === '-') return start
  return `${start} - ${end}`
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/work-list', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('GET', '/api/reports/work-list', 401, apiKey, 'Unauthorized')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const roleGroup = searchParams.get('role_group') === 'finance' ? 'finance' : 'general'

    const agencyDb = await getAgencyDb()
    const amTable = agencyDb ? `\`${agencyDb}\`.v_6kMWFc_agcy_agency_members` : null

    const sellerName = amTable
      ? `COALESCE(seller_am.nick_name, CAST(o.seller_agency_member_id AS CHAR), '-')`
      : `COALESCE(CAST(o.seller_agency_member_id AS CHAR), '-')`

    const crmName = amTable
      ? `COALESCE(crm_am.nick_name, CAST(o.crm_agency_member_id AS CHAR), '-')`
      : `COALESCE(CAST(o.crm_agency_member_id AS CHAR), '-')`

    const agencyJoins = amTable ? `
      LEFT JOIN ${amTable} seller_am ON seller_am.id = o.seller_agency_member_id
      LEFT JOIN ${amTable} crm_am ON crm_am.id = o.crm_agency_member_id
    ` : ''

    const query = `
      SELECT
        t.id AS task_id,
        t.date AS task_date_raw,
        tt.name AS task_type_name,
        o.order_code,
        o.customer_name,
        o.customer_phone_number,
        t.order_created_at AS order_created_at_raw,
        JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')) AS period_start_raw,
        JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.end_at')) AS period_end_raw,
        COALESCE(oi_sum.traveler_count, 0) AS traveler_count,
        ${sellerName} AS seller_nick_name,
        ${crmName} AS crm_nick_name
      FROM v_Xqc7k7_tasks t
      INNER JOIN v_Xqc7k7_task_types tt
        ON tt.id = t.task_type_id
      INNER JOIN v_Xqc7k7_orders o
        ON o.id = t.order_id
      LEFT JOIN (
        SELECT order_id, SUM(quantity) AS traveler_count
        FROM v_Xqc7k7_order_items
        WHERE product_room_type_id IS NOT NULL
        GROUP BY order_id
      ) oi_sum
        ON oi_sum.order_id = o.id
      ${agencyJoins}
      WHERE LOWER(COALESCE(t.status, '')) = 'to_do'
        AND (
          (? = 'finance' AND JSON_CONTAINS(COALESCE(tt.for_roles, JSON_ARRAY()), JSON_QUOTE('finance')))
          OR
          (? = 'general' AND (
            JSON_CONTAINS(COALESCE(tt.for_roles, JSON_ARRAY()), JSON_QUOTE('admin'))
            OR JSON_CONTAINS(COALESCE(tt.for_roles, JSON_ARRAY()), JSON_QUOTE('sale'))
            OR JSON_CONTAINS(COALESCE(tt.for_roles, JSON_ARRAY()), JSON_QUOTE('telesales'))
          ))
        )
      ORDER BY t.date ASC, t.id ASC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [roleGroup, roleGroup])
    const tasks = (rows as any[]).map((row, index) => ({
      seq: index + 1,
      task_id: row.task_id,
      task_date: formatThaiDate(row.task_date_raw),
      task_date_raw: row.task_date_raw,
      task_type_name: row.task_type_name || '-',
      order_code: row.order_code || '-',
      customer_name: row.customer_name || '-',
      customer_phone_number: row.customer_phone_number || '-',
      travel_period_text: formatTravelPeriod(row.period_start_raw, row.period_end_raw),
      traveler_count: parseInt(row.traveler_count, 10) || 0,
      order_created_at: formatThaiDate(row.order_created_at_raw),
      order_created_at_raw: row.order_created_at_raw,
      seller_nick_name: row.seller_nick_name || '-',
      crm_nick_name: row.crm_nick_name || '-',
    }))

    logApiRequest('GET', '/api/reports/work-list', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        tasks,
        summary: {
          total_tasks: tasks.length,
          role_group: roleGroup,
        },
      },
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/work-list', 500, apiKey, error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
