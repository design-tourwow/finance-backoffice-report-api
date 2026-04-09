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

  const conditions: string[] = ['1=1']
  const params: any[] = []

  // created_at filter (order creation date)
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
  // admin: no restriction

  // seller filter
  if (sellerId) {
    conditions.push(`o.seller_agency_member_id = ?`)
    params.push(parseInt(sellerId, 10))
  }

  // order_status filter
  if (orderStatus === 'not_canceled') {
    conditions.push(`LOWER(o.order_status) != 'canceled'`)
  } else if (orderStatus === 'canceled') {
    conditions.push(`LOWER(o.order_status) = 'canceled'`)
  }

  const whereClause = conditions.join(' AND ')

  const query = `
    SELECT
      o.id,
      o.order_code,
      DATE_FORMAT(CONVERT_TZ(o.created_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i') AS created_at,
      o.customer_name,
      o.product_period_snapshot,
      COALESCE(o.net_amount, 0)            AS net_amount,
      COALESCE(o.supplier_commission, 0)   AS supplier_commission,
      COALESCE(o.discount, 0)              AS discount,
      o.seller_agency_member_id,
      COALESCE(am.nick_name, '-')          AS seller_nick_name,
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
    LEFT JOIN v_6kMWFc_agcy_agency_members am
      ON am.id = o.seller_agency_member_id
    WHERE ${whereClause}
    GROUP BY
      o.id, o.order_code, o.created_at, o.customer_name, o.product_period_snapshot,
      o.net_amount, o.supplier_commission, o.discount, o.seller_agency_member_id, am.nick_name
    ORDER BY o.created_at DESC
  `

  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    const totalNetAmount = rows.reduce((sum, row: any) => sum + parseFloat(row.net_amount || 0), 0)
    const totalCommission = rows.reduce((sum, row: any) => sum + parseFloat(row.supplier_commission || 0), 0)
    const totalDiscount = rows.reduce((sum, row: any) => sum + parseFloat(row.discount || 0), 0)
    const totalNetCommission = totalCommission - totalDiscount

    logApiRequest('GET', '/api/reports/commission-plus', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        orders: rows,
        summary: {
          total_orders: rows.length,
          total_net_amount: totalNetAmount,
          total_commission: totalCommission,
          total_discount: totalDiscount,
          total_net_commission: totalNetCommission,
        },
        filters: { created_at_from: createdAtFrom, created_at_to: createdAtTo, paid_at_from: paidAtFrom, paid_at_to: paidAtTo, job_position: jobPosition, seller_id: sellerId, order_status: orderStatus }
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/commission-plus', 500, apiKey, error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
