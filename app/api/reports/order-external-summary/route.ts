import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/reports/order-external-summary
 *
 * Orders whose first installment payment landed in a month/year different
 * from the order creation month/year (excluding payments landing within the
 * first 3 days of the following month, which are treated as carry-over).
 *
 * Ported from be-2-report:
 *   - controller: supplier-performance.controller.ts · getOrderExternalSummary
 *   - query-builder: order-external-summary-query-builder.ts · buildMainQuery
 *
 * Response shape:
 *   [
 *     {
 *       order_code, created_at, customer_name,
 *       net_amount, supplier_commission, discount,
 *       first_installment_paid, paid_at, seller_nickname
 *     }, ...
 *   ]
 */

type Filters = {
  year?: number
  quarter?: number
  month?: number
  country_id?: number
  job_position?: string
  team_number?: number
  user_id?: number
}

function parseIntParam(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined
  return n
}

function parseFilters(searchParams: URLSearchParams): {
  filters: Filters
  error?: string
} {
  const filters: Filters = {}
  const year = parseIntParam(searchParams.get('year'))
  if (year !== undefined) {
    if (year < 2000 || year > 2100) {
      return { filters, error: 'Year parameter must be between 2000 and 2100' }
    }
    filters.year = year
  }
  const quarter = parseIntParam(searchParams.get('quarter'))
  if (quarter !== undefined) {
    if (quarter < 1 || quarter > 4) {
      return { filters, error: 'Quarter parameter must be between 1 and 4' }
    }
    filters.quarter = quarter
  }
  const month = parseIntParam(searchParams.get('month'))
  if (month !== undefined) {
    if (month < 1 || month > 12) {
      return { filters, error: 'Month parameter must be between 1 and 12' }
    }
    filters.month = month
  }
  const country_id = parseIntParam(searchParams.get('country_id'))
  if (country_id !== undefined) {
    if (country_id <= 0) {
      return { filters, error: 'Country ID parameter must be a positive integer' }
    }
    filters.country_id = country_id
  }
  const job_position = searchParams.get('job_position')
  if (job_position !== null && job_position.trim() !== '') {
    filters.job_position = job_position.trim()
  }
  const team_number = parseIntParam(searchParams.get('team_number'))
  if (team_number !== undefined) {
    if (team_number <= 0 || team_number > 999) {
      return { filters, error: 'Team number must be a positive integer between 1 and 999' }
    }
    filters.team_number = team_number
  }
  const user_id = parseIntParam(searchParams.get('user_id'))
  if (user_id !== undefined) {
    if (user_id <= 0) {
      return { filters, error: 'User ID must be a positive integer' }
    }
    filters.user_id = user_id
  }

  if (filters.quarter !== undefined && filters.month !== undefined) {
    const qm: Record<number, number[]> = {
      1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12]
    }
    if (!qm[filters.quarter].includes(filters.month)) {
      return {
        filters,
        error: `Month ${filters.month} is not in quarter ${filters.quarter}`
      }
    }
  }
  return { filters }
}

function buildQuery(filters: Filters): { sql: string; params: any[] } {
  const params: any[] = []

  let sql = `
    SELECT
      o.order_code,
      DATE_ADD(o.created_at, INTERVAL 7 HOUR) AS created_at,
      o.customer_name,
      COALESCE(o.net_amount, 0) AS net_amount,
      COALESCE(o.supplier_commission, 0) AS supplier_commission,
      COALESCE(o.discount, 0) AS discount,
      TRUE AS first_installment_paid,
      DATE_ADD(first_payment.paid_at, INTERVAL 7 HOUR) AS paid_at,
      m.nick_name AS seller_nickname
    FROM tw_tourwow_db_views.v_Xqc7k7_orders o
    INNER JOIN tw_tourwow_db_views.v_Xqc7k7_customer_order_installments i ON o.id = i.order_id
    INNER JOIN (
      SELECT
        ihp.customer_order_installment_id,
        MIN(p.paid_at) AS paid_at
      FROM tw_tourwow_db_views.v_Xqc7k7_customer_order_installments_has_payments ihp
      INNER JOIN tw_tourwow_db_views.v_Xqc7k7_payments p ON ihp.payment_id = p.id
      GROUP BY ihp.customer_order_installment_id
    ) first_payment ON i.id = first_payment.customer_order_installment_id
    LEFT JOIN twp_agencies_db_views.v_6kMWFc_agcy_agency_members m ON o.seller_agency_member_id = m.id
    WHERE o.order_status != 'Canceled'
      AND i.ordinal = 1
      AND i.status = 'Paid'
      AND o.supplier_commission > 0
      AND DATE_FORMAT(DATE_ADD(first_payment.paid_at, INTERVAL 7 HOUR), '%Y-%m')
          != DATE_FORMAT(DATE_ADD(o.created_at, INTERVAL 7 HOUR), '%Y-%m')
      AND NOT (
        DATE_FORMAT(DATE_ADD(first_payment.paid_at, INTERVAL 7 HOUR), '%Y-%m') =
          DATE_FORMAT(DATE_ADD(DATE_ADD(o.created_at, INTERVAL 7 HOUR), INTERVAL 1 MONTH), '%Y-%m')
        AND DAY(DATE_ADD(first_payment.paid_at, INTERVAL 7 HOUR)) <= 3
      )
  `

  if (filters.year !== undefined) {
    sql += ` AND YEAR(DATE_ADD(o.created_at, INTERVAL 7 HOUR)) = ?`
    params.push(filters.year)
  }
  if (filters.quarter !== undefined) {
    sql += ` AND QUARTER(DATE_ADD(o.created_at, INTERVAL 7 HOUR)) = ?`
    params.push(filters.quarter)
  }
  if (filters.month !== undefined) {
    sql += ` AND MONTH(DATE_ADD(o.created_at, INTERVAL 7 HOUR)) = ?`
    params.push(filters.month)
  }

  if (filters.country_id !== undefined) {
    sql += ` AND o.product_snapshot IS NOT NULL
             AND o.product_snapshot != ''
             AND JSON_VALID(o.product_snapshot) = 1
             AND JSON_TYPE(JSON_EXTRACT(o.product_snapshot, '$.countries')) = 'ARRAY'
             AND JSON_CONTAINS(JSON_EXTRACT(o.product_snapshot, '$.countries'), JSON_OBJECT('id', ?))`
    params.push(filters.country_id)
  }

  if (filters.job_position !== undefined) {
    sql += ` AND EXISTS (
      SELECT 1 FROM twp_agencies_db_views.v_6kMWFc_agcy_agency_members m2
      WHERE m2.id = o.seller_agency_member_id
        AND LOWER(TRIM(m2.job_position)) = LOWER(TRIM(?))
    )`
    params.push(filters.job_position)
  }
  if (filters.team_number !== undefined) {
    sql += ` AND o.team_number = ?`
    params.push(filters.team_number)
  }
  if (filters.user_id !== undefined) {
    sql += ` AND o.seller_agency_member_id = ?`
    params.push(filters.user_id)
  }

  sql += ` ORDER BY o.created_at DESC`

  return { sql, params }
}

function toISO(value: any): any {
  if (value instanceof Date) return value.toISOString()
  return value
}

export async function GET(request: NextRequest) {
  const auth = authenticate(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: auth.error ?? 'Invalid token' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const { filters, error } = parseFilters(searchParams)
  if (error) {
    return NextResponse.json({ error, status: 400 }, { status: 400 })
  }

  try {
    const { sql, params } = buildQuery(filters)
    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params)

    const response = rows.map((row) => ({
      order_code: row.order_code,
      created_at: toISO(row.created_at),
      customer_name: row.customer_name ?? 'N/A',
      net_amount: Number(row.net_amount) || 0,
      supplier_commission: Number(row.supplier_commission) || 0,
      discount: Number(row.discount) || 0,
      first_installment_paid: Boolean(row.first_installment_paid),
      paid_at: toISO(row.paid_at),
      seller_nickname: row.seller_nickname ?? null
    }))

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[GET /api/reports/order-external-summary] error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve order external summary',
        message: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}
