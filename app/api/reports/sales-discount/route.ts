import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/reports/sales-discount
 *
 * Commission / discount metrics aggregated by sales member, with
 * cross-database join between tw_tourwow_db_views (orders) and
 * twp_agencies_db_views (agency members).
 *
 * Ported from be-2-report:
 *   - controller: supplier-performance.controller.ts · getSalesDiscountAnalysis
 *   - query-builder: sales-discount-query-builder.ts · buildMainQuery
 *
 * Response shape:
 *   [
 *     {
 *       sales_id, sales_name,
 *       metrics: {
 *         total_commission, total_discount, discount_percentage,
 *         order_count, net_commission
 *       }
 *     }, ...
 *   ]
 */

type Filters = {
  year?: number
  quarter?: number
  month?: number
  country_ids?: number[]
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

/** Parse a comma-separated list of positive integers. Accepts a single
 * integer, a CSV like "1,2,3", or null/empty → undefined. Returns undefined
 * on any invalid token so the caller can reject the request. */
function parseIntListParam(value: string | null): number[] | undefined | 'invalid' {
  if (value === null || value.trim() === '') return undefined
  const parts = value.split(',').map((s) => s.trim()).filter((s) => s !== '')
  if (parts.length === 0) return undefined
  const out: number[] = []
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return 'invalid'
    out.push(n)
  }
  return out
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
  const country_ids = parseIntListParam(searchParams.get('country_id'))
  if (country_ids === 'invalid') {
    return { filters, error: 'Country ID parameter must be positive integers (comma-separated for multi)' }
  }
  if (country_ids !== undefined) {
    filters.country_ids = country_ids
  }
  const job_position = searchParams.get('job_position')
  if (job_position !== null && job_position.trim() !== '') {
    filters.job_position = job_position.trim()
  }
  const team_number = parseIntParam(searchParams.get('team_number'))
  if (team_number !== undefined) {
    if (team_number <= 0) {
      return { filters, error: 'Team number parameter must be a positive integer' }
    }
    filters.team_number = team_number
  }
  const user_id = parseIntParam(searchParams.get('user_id'))
  if (user_id !== undefined) {
    if (user_id <= 0) {
      return { filters, error: 'User ID parameter must be a positive integer' }
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
      m.id AS sales_id,
      CONCAT(m.first_name, ' (', m.nick_name, ')') AS sales_name,
      SUM(COALESCE(o.supplier_commission, 0)) AS total_commission,
      SUM(COALESCE(o.discount, 0)) AS total_discount,
      CASE
        WHEN SUM(COALESCE(o.supplier_commission, 0)) > 0
        THEN (SUM(COALESCE(o.discount, 0)) / SUM(COALESCE(o.supplier_commission, 0))) * 100
        ELSE 0
      END AS discount_percentage,
      COUNT(DISTINCT o.id) AS order_count
    FROM tw_tourwow_db_views.v_Xqc7k7_orders o
    INNER JOIN tw_tourwow_db_views.v_Xqc7k7_customer_order_installments i ON o.id = i.order_id
    INNER JOIN twp_agencies_db_views.v_6kMWFc_agcy_agency_members m ON o.seller_agency_member_id = m.id
    WHERE o.order_status != 'Canceled'
      AND i.ordinal = 1
      AND i.status = 'Paid'
      AND o.supplier_commission > 0
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

  if (filters.country_ids !== undefined && filters.country_ids.length > 0) {
    const orClauses = filters.country_ids
      .map(() => `JSON_CONTAINS(JSON_EXTRACT(o.product_snapshot, '$.countries'), JSON_OBJECT('id', ?))`)
      .join(' OR ')
    sql += ` AND o.product_snapshot IS NOT NULL
             AND o.product_snapshot != ''
             AND JSON_VALID(o.product_snapshot) = 1
             AND JSON_TYPE(JSON_EXTRACT(o.product_snapshot, '$.countries')) = 'ARRAY'
             AND (${orClauses})`
    for (const id of filters.country_ids) params.push(id)
  }

  if (filters.job_position !== undefined) {
    sql += ` AND LOWER(TRIM(m.job_position)) = LOWER(TRIM(?))`
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

  sql += `
    GROUP BY m.id, m.first_name, m.nick_name
    ORDER BY total_commission DESC
  `

  return { sql, params }
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

    const response = rows.map((row) => {
      const totalCommission = Number(row.total_commission) || 0
      const totalDiscount = Number(row.total_discount) || 0
      return {
        sales_id: row.sales_id,
        sales_name: row.sales_name,
        metrics: {
          total_commission: totalCommission,
          total_discount: totalDiscount,
          discount_percentage: Number(row.discount_percentage) || 0,
          order_count: Number(row.order_count) || 0,
          net_commission: totalCommission - totalDiscount
        }
      }
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[GET /api/reports/sales-discount] error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve sales discount analysis',
        message: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}
