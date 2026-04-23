import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/reports/supplier-performance
 *
 * Returns commission / net-commission / pax metrics aggregated by supplier,
 * filtered by year / quarter / month / country_id / job_position /
 * team_number / user_id.
 *
 * Ported from be-2-report:
 *   - controller: supplier-performance.controller.ts · getSupplierPerformance
 *   - query-builder: supplier-query-builder.ts · buildMainQuery
 *
 * Response shape:
 *   [
 *     {
 *       supplier_id, supplier_name_th, supplier_name_en,
 *       metrics: {
 *         total_commission, total_net_commission, total_pax,
 *         avg_commission_per_pax, avg_net_commission_per_pax
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

/** Parse a comma-separated list of positive integers. */
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

  // Quarter/month consistency check (mirrors be-2-report)
  if (filters.quarter !== undefined && filters.month !== undefined) {
    const quarterMonths: Record<number, number[]> = {
      1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12]
    }
    if (!quarterMonths[filters.quarter].includes(filters.month)) {
      return {
        filters,
        error: `Month ${filters.month} is not in quarter ${filters.quarter}`
      }
    }
  }

  return { filters }
}

/** Build the same JSON_CONTAINS condition be-2-report uses for country
 * filtering. When multiple country ids are passed, the `(A OR B OR …)`
 * disjunction is assembled; the caller must push one param per id. */
function jsonCountryCondition(column: string, count: number): string {
  const orClauses = new Array(count)
    .fill(`JSON_CONTAINS(JSON_EXTRACT(${column}, '$.countries'), JSON_OBJECT('id', ?))`)
    .join(' OR ')
  return (
    `${column} IS NOT NULL AND ${column} != '' ` +
    `AND JSON_VALID(${column}) = 1 ` +
    `AND JSON_TYPE(JSON_EXTRACT(${column}, '$.countries')) = 'ARRAY' ` +
    `AND (${orClauses})`
  )
}

function buildDateFilters(
  filters: Filters,
  params: any[],
  tableAlias = 'o'
): string | null {
  const conditions: string[] = []
  if (filters.year !== undefined) {
    conditions.push(`YEAR(DATE_ADD(${tableAlias}.created_at, INTERVAL 7 HOUR)) = ?`)
    params.push(filters.year)
  }
  if (filters.quarter !== undefined) {
    conditions.push(`QUARTER(DATE_ADD(${tableAlias}.created_at, INTERVAL 7 HOUR)) = ?`)
    params.push(filters.quarter)
  }
  if (filters.month !== undefined) {
    conditions.push(`MONTH(DATE_ADD(${tableAlias}.created_at, INTERVAL 7 HOUR)) = ?`)
    params.push(filters.month)
  }
  return conditions.length ? conditions.join(' AND ') : null
}

function buildCountryFilter(
  filters: Filters,
  params: any[],
  tableAlias = 'o'
): string | null {
  if (filters.country_ids === undefined || filters.country_ids.length === 0) return null
  for (const id of filters.country_ids) params.push(id)
  return jsonCountryCondition(`${tableAlias}.product_snapshot`, filters.country_ids.length)
}

function buildUserFilters(
  filters: Filters,
  params: any[],
  agencyAlias = 'am'
): string | null {
  const conditions: string[] = []
  if (filters.job_position !== undefined) {
    conditions.push(`LOWER(TRIM(${agencyAlias}.job_position)) = LOWER(TRIM(?))`)
    params.push(filters.job_position)
  }
  if (filters.team_number !== undefined) {
    const orderAlias = agencyAlias === 'am2' ? 'o2' : 'o'
    conditions.push(`${orderAlias}.team_number = ?`)
    params.push(filters.team_number)
  }
  if (filters.user_id !== undefined) {
    const orderAlias = agencyAlias === 'am2' ? 'o2' : 'o'
    conditions.push(`${orderAlias}.seller_agency_member_id = ?`)
    params.push(filters.user_id)
  }
  return conditions.length ? conditions.join(' AND ') : null
}

function buildSupplierQuery(filters: Filters): { sql: string; params: any[] } {
  const params: any[] = []

  let sql = `
    SELECT
      s.id AS supplier_id,
      s.name_th AS supplier_name_th,
      s.name_en AS supplier_name_en,
      SUM(COALESCE(o.supplier_commission, 0)) AS total_commission,
      SUM(COALESCE(o.supplier_commission, 0) - COALESCE(o.discount, 0)) AS total_net_commission,
      SUM(COALESCE(pax_subq.total_pax, 0)) AS total_pax,
      CASE
        WHEN SUM(COALESCE(pax_subq.total_pax, 0)) > 0
        THEN SUM(COALESCE(o.supplier_commission, 0)) / SUM(COALESCE(pax_subq.total_pax, 0))
        ELSE 0
      END AS avg_commission_per_pax,
      CASE
        WHEN SUM(COALESCE(pax_subq.total_pax, 0)) > 0
        THEN SUM(COALESCE(o.supplier_commission, 0) - COALESCE(o.discount, 0)) / SUM(COALESCE(pax_subq.total_pax, 0))
        ELSE 0
      END AS avg_net_commission_per_pax
    FROM tw_tourwow_db_views.v_Xqc7k7_orders o
    INNER JOIN tw_tourwow_db_views.v_Xqc7k7_customer_order_installments i ON o.id = i.order_id
    INNER JOIN tw_suppliers_db_views.v_GsF2WeS_suppliers s ON o.product_owner_supplier_id = s.id
  `

  const needsAgency =
    filters.job_position !== undefined || filters.user_id !== undefined

  if (needsAgency) {
    sql += `
      LEFT JOIN twp_agencies_db_views.v_6kMWFc_agcy_agency_members am
        ON o.seller_agency_member_id = am.id
    `
  }

  sql += `
    LEFT JOIN (
      SELECT
        oi.order_id,
        SUM(oi.quantity) AS total_pax
      FROM tw_tourwow_db_views.v_Xqc7k7_order_items oi
      INNER JOIN tw_tourwow_db_views.v_Xqc7k7_orders o2 ON oi.order_id = o2.id
      INNER JOIN tw_tourwow_db_views.v_Xqc7k7_customer_order_installments i2 ON o2.id = i2.order_id
  `

  if (needsAgency) {
    sql += `
      LEFT JOIN twp_agencies_db_views.v_6kMWFc_agcy_agency_members am2
        ON o2.seller_agency_member_id = am2.id
    `
  }

  sql += `
      WHERE oi.product_room_type_id IS NOT NULL
        AND o2.order_status != 'Canceled'
        AND i2.ordinal = 1
        AND i2.status = 'Paid'
        AND o2.supplier_commission > 0
  `

  const subDate = buildDateFilters(filters, params, 'o2')
  if (subDate) sql += ` AND ${subDate}`
  const subCountry = buildCountryFilter(filters, params, 'o2')
  if (subCountry) sql += ` AND ${subCountry}`
  const subUser = buildUserFilters(filters, params, 'am2')
  if (subUser) sql += ` AND ${subUser}`

  sql += `
      GROUP BY oi.order_id
    ) pax_subq ON o.id = pax_subq.order_id
    WHERE o.order_status != 'Canceled'
      AND i.ordinal = 1
      AND i.status = 'Paid'
      AND o.supplier_commission > 0
  `

  const mainDate = buildDateFilters(filters, params, 'o')
  if (mainDate) sql += ` AND ${mainDate}`
  const mainCountry = buildCountryFilter(filters, params, 'o')
  if (mainCountry) sql += ` AND ${mainCountry}`
  const mainUser = buildUserFilters(filters, params, 'am')
  if (mainUser) sql += ` AND ${mainUser}`

  sql += `
    GROUP BY s.id, s.name_th, s.name_en
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
    const { sql, params } = buildSupplierQuery(filters)
    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql, params)

    const response = rows.map((row) => ({
      supplier_id: row.supplier_id,
      supplier_name_th: row.supplier_name_th,
      supplier_name_en: row.supplier_name_en,
      metrics: {
        total_commission: Number(row.total_commission) || 0,
        total_net_commission: Number(row.total_net_commission) || 0,
        total_pax: Number(row.total_pax) || 0,
        avg_commission_per_pax: Number(row.avg_commission_per_pax) || 0,
        avg_net_commission_per_pax: Number(row.avg_net_commission_per_pax) || 0
      }
    }))

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[GET /api/reports/supplier-performance] error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve supplier performance data',
        message: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}
