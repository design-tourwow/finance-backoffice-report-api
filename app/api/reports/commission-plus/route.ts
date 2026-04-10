import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// Discover which database contains v_6kMWFc_agcy_agency_members
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
    logApiRequest('GET', '/api/reports/commission-plus', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('GET', '/api/reports/commission-plus', 401, apiKey, 'Unauthorized')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const createdAtFrom = searchParams.get('created_at_from') || ''
  const createdAtTo   = searchParams.get('created_at_to')   || ''
  const paidAtFrom    = searchParams.get('paid_at_from')    || ''
  const paidAtTo      = searchParams.get('paid_at_to')      || ''
  const jobPosition   = searchParams.get('job_position')    || 'admin'
  const sellerId      = searchParams.get('seller_id')       || ''
  const orderStatus   = searchParams.get('order_status')    || 'all'

  // Discover agency DB for seller name lookup
  const agencyDb = await getAgencyDb()
  const amTable = agencyDb ? `\`${agencyDb}\`.v_6kMWFc_agcy_agency_members` : null

  const conditions: string[] = ['1=1']
  const params: any[] = []

  if (createdAtFrom) {
    conditions.push(`DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) >= ?`)
    params.push(createdAtFrom)
  }
  if (createdAtTo) {
    conditions.push(`DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) <= ?`)
    params.push(createdAtTo)
  }

  // paid_at filter — end date is automatically +3 days
  if (paidAtFrom) {
    conditions.push(`DATE(CONVERT_TZ(p.paid_at, '+00:00', '+07:00')) >= ?`)
    params.push(paidAtFrom)
  }
  if (paidAtTo) {
    conditions.push(`DATE(CONVERT_TZ(p.paid_at, '+00:00', '+07:00')) <= DATE_ADD(?, INTERVAL 3 DAY)`)
    params.push(paidAtTo)
  }

  // job_position → is_old_customer mapping
  if (jobPosition === 'ts') {
    conditions.push(`o.is_old_customer = 0`)
  } else if (jobPosition === 'crm') {
    conditions.push(`o.is_old_customer = 1`)
  }

  if (sellerId) {
    conditions.push(`o.seller_agency_member_id = ?`)
    params.push(parseInt(sellerId, 10))
  }

  if (orderStatus === 'not_canceled') {
    conditions.push(`LOWER(o.order_status) != 'canceled'`)
  } else if (orderStatus === 'canceled') {
    conditions.push(`LOWER(o.order_status) = 'canceled'`)
  }

  const whereClause = conditions.join(' AND ')

  // Build seller name expression depending on whether agency table was found
  const sellerName = amTable
    ? `COALESCE(am.nick_name, CAST(o.seller_agency_member_id AS CHAR), '-')`
    : `COALESCE(CAST(o.seller_agency_member_id AS CHAR), '-')`

  const amJoin = amTable
    ? `LEFT JOIN ${amTable} am ON am.id = o.seller_agency_member_id`
    : ''

  const query = `
    SELECT
      o.id,
      o.order_code,
      DATE_FORMAT(CONVERT_TZ(o.created_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i') AS created_at,
      o.customer_name,
      JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')) AS period_start_raw,
      JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.end_at'))   AS period_end_raw,
      COALESCE(o.net_amount, 0)            AS net_amount,
      COALESCE(o.supplier_commission, 0)   AS supplier_commission,
      COALESCE(o.discount, 0)              AS discount,
      o.seller_agency_member_id,
      ${sellerName}                        AS seller_nick_name,
      DATE_FORMAT(CONVERT_TZ(MIN(p.paid_at), '+00:00', '+07:00'), '%Y-%m-%d') AS first_paid_at,
      COALESCE((
        SELECT SUM(oi.quantity)
        FROM v_Xqc7k7_order_items oi
        WHERE oi.order_id = o.id
          AND oi.product_room_type_id IS NOT NULL
      ), 0) AS room_quantity
    FROM v_Xqc7k7_orders o
    INNER JOIN v_Xqc7k7_customer_order_installments ci
      ON ci.order_id = o.id
      AND ci.ordinal = 1
      AND LOWER(ci.status) = 'paid'
    INNER JOIN v_Xqc7k7_customer_order_installments_has_payments cohp
      ON cohp.customer_order_installments_id = ci.id
    INNER JOIN v_Xqc7k7_payments p
      ON p.id = cohp.payment_id
    ${amJoin}
    WHERE ${whereClause}
    GROUP BY
      o.id, o.order_code, o.created_at, o.customer_name,
      o.product_period_snapshot, o.net_amount, o.supplier_commission,
      o.discount, o.seller_agency_member_id, seller_nick_name
    ORDER BY o.created_at DESC
  `

  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    // Format period from ISO strings
    const orders = (rows as any[]).map(row => {
      let periodStart = ''
      let periodEnd = ''
      try {
        if (row.period_start_raw) {
          const d = new Date(row.period_start_raw)
          periodStart = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()+543}`
        }
        if (row.period_end_raw) {
          const d = new Date(row.period_end_raw)
          periodEnd = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()+543}`
        }
      } catch {}
      return {
        ...row,
        product_period_snapshot: periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : (periodStart || periodEnd || '-'),
        period_start_raw: undefined,
        period_end_raw: undefined,
      }
    })

    const totalNetAmount    = orders.reduce((s, r) => s + parseFloat(r.net_amount    || 0), 0)
    const totalCommission   = orders.reduce((s, r) => s + parseFloat(r.supplier_commission || 0), 0)
    const totalDiscount     = orders.reduce((s, r) => s + parseFloat(r.discount      || 0), 0)
    const totalNetCommission = totalCommission - totalDiscount

    logApiRequest('GET', '/api/reports/commission-plus', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        orders,
        summary: {
          total_orders: orders.length,
          total_net_amount: totalNetAmount,
          total_commission: totalCommission,
          total_discount: totalDiscount,
          total_net_commission: totalNetCommission,
        },
        meta: { agency_db_found: !!agencyDb }
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/commission-plus', 500, apiKey, error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
