import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/reports/order-has-discount
 *
 * Detailed order rows that have discount information, joined with seller and
 * CRM agency members, aggregated over installments for status info.
 *
 * Ported from be-2-report:
 *   - controller: supplier-performance.controller.ts · getOrderDiscountAnalysis
 *   - query-builder: order-discount-query-builder.ts · buildMainQuery
 *
 * Response shape:
 *   [
 *     {
 *       order_info:       { order_code, created_at },
 *       customer_info:    { customer_name },
 *       payment_details:  { total_installments, paid_installments, status_list },
 *       sales_crm:        { seller_name, crm_name },
 *       financial_metrics:{ net_amount, supplier_commission, discount, discount_percent }
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
      o.order_code,
      o.created_at,
      o.customer_name,
      COUNT(i.id) AS total_installments,
      SUM(CASE WHEN LOWER(i.status) = 'paid' THEN 1 ELSE 0 END) AS paid_installments,
      GROUP_CONCAT(
        CONCAT('#', i.ordinal, ': ', LOWER(i.status))
        ORDER BY i.ordinal ASC
        SEPARATOR ', '
      ) AS status_list,
      CONCAT(seller.first_name, ' (', seller.nick_name, ')') AS seller_name,
      CONCAT(crm.first_name, ' (', crm.nick_name, ')') AS crm_name,
      COALESCE(o.net_amount, 0) AS net_amount,
      COALESCE(o.supplier_commission, 0) AS supplier_commission,
      COALESCE(o.discount, 0) AS discount,
      CASE
        WHEN COALESCE(o.supplier_commission, 0) > 0
        THEN (COALESCE(o.discount, 0) / COALESCE(o.supplier_commission, 0)) * 100
        ELSE 0
      END AS discount_percent
    FROM tw_tourwow_db_views.v_Xqc7k7_orders o
    INNER JOIN tw_tourwow_db_views.v_Xqc7k7_customer_order_installments i ON o.id = i.order_id
    LEFT JOIN twp_agencies_db_views.v_6kMWFc_agcy_agency_members seller ON o.seller_agency_member_id = seller.id
    LEFT JOIN twp_agencies_db_views.v_6kMWFc_agcy_agency_members crm ON o.crm_agency_member_id = crm.id
    WHERE o.order_status != 'Canceled'
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
    sql += ` AND LOWER(TRIM(seller.job_position)) = LOWER(TRIM(?))`
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
    GROUP BY o.id, o.order_code, o.created_at, o.customer_name,
             o.net_amount, o.supplier_commission, o.discount,
             seller.first_name, seller.nick_name,
             crm.first_name, crm.nick_name
    ORDER BY o.created_at DESC
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

    const response = rows.map((row) => ({
      order_info: {
        order_code: row.order_code,
        created_at: row.created_at
      },
      customer_info: {
        customer_name: row.customer_name ?? 'N/A'
      },
      payment_details: {
        total_installments: Number(row.total_installments) || 0,
        paid_installments: Number(row.paid_installments) || 0,
        status_list: row.status_list ?? ''
      },
      sales_crm: {
        seller_name: row.seller_name ?? 'N/A',
        crm_name: row.crm_name ?? 'N/A'
      },
      financial_metrics: {
        net_amount: Number(row.net_amount) || 0,
        supplier_commission: Number(row.supplier_commission) || 0,
        discount: Number(row.discount) || 0,
        discount_percent: Number(row.discount_percent) || 0
      }
    }))

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[GET /api/reports/order-has-discount] error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve order discount analysis',
        message: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}
