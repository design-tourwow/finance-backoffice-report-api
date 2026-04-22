import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

/**
 * GET /api/countries
 * Returns all countries from tw_locations_db_views.v_Hdz2WSB_countries
 * ordered by search_priority (desc) then name_en (asc).
 *
 * Ported from be-2-report:
 *   - controller: supplier-performance.controller.ts · getAllCountries
 *   - query-builder: countries-query-builder.ts · buildGetAllCountriesQuery
 *
 * Response: raw array (matches be-2-report behavior; frontend normaliseArray
 * also accepts `{ data: [...] }` but the source returned raw arrays).
 */
export async function GET(request: NextRequest) {
  // 1. Auth
  const auth = authenticate(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: auth.error ?? 'Invalid token' },
      { status: 401 }
    )
  }

  try {
    const sql = `
      SELECT
        id,
        name_th,
        name_en,
        country_code,
        icon_path
      FROM tw_locations_db_views.v_Hdz2WSB_countries
      ORDER BY
        search_priority DESC,
        name_en ASC
    `

    const [rows] = await mysqlPool.query<RowDataPacket[]>(sql)

    // Format response - include icon_path only if present (matches be-2-report)
    const countries = rows.map((row) => {
      const out: Record<string, unknown> = {
        id: row.id,
        name_th: row.name_th,
        name_en: row.name_en,
        country_code: row.country_code
      }
      if (row.icon_path) {
        out.icon_path = row.icon_path
      }
      return out
    })

    return NextResponse.json(countries)
  } catch (error: any) {
    console.error('[GET /api/countries] error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve countries', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
