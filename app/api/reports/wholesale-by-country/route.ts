import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/wholesale-by-country - รายงาน Wholesale แยกตามประเทศปลายทาง
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/wholesale-by-country', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  // Authenticate using JWT or API Key
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('GET', '/api/reports/wholesale-by-country', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const countryIdParam = searchParams.get('country_id')
    const supplierIdParam = searchParams.get('supplier_id')
    const travelDateFrom = searchParams.get('travel_date_from')
    const travelDateTo = searchParams.get('travel_date_to')
    const bookingDateFrom = searchParams.get('booking_date_from')
    const bookingDateTo = searchParams.get('booking_date_to')

    // Parse comma-separated IDs
    const countryIds = countryIdParam ? countryIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
    const supplierIds = supplierIdParam ? supplierIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []

    // Query to get wholesale-country breakdown
    let query = `
      SELECT
        o.product_owner_supplier_id as supplier_id,
        s.name_th as supplier_name,
        JSON_UNQUOTE(JSON_EXTRACT(o.product_snapshot, '$.countries[0].name_th')) as country_name,
        COUNT(*) as order_count
      FROM v_Xqc7k7_orders o
      LEFT JOIN tw_suppliers_db_views.v_GsF2WeS_suppliers s ON o.product_owner_supplier_id = s.id
      WHERE o.order_status != 'Canceled'
        AND o.deleted_at IS NULL
        AND JSON_EXTRACT(o.product_snapshot, '$.countries[0].id') IS NOT NULL
    `
    const params: any[] = []

    // Filter by country_id (support multiple IDs)
    if (countryIds.length > 0) {
      const placeholders = countryIds.map(() => '?').join(',')
      query += ` AND CAST(JSON_EXTRACT(o.product_snapshot, '$.countries[0].id') AS UNSIGNED) IN (${placeholders})`
      params.push(...countryIds)
    }

    // Filter by supplier_id (support multiple IDs)
    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map(() => '?').join(',')
      query += ` AND o.product_owner_supplier_id IN (${placeholders})`
      params.push(...supplierIds)
    }

    if (travelDateFrom) {
      query += ` AND JSON_EXTRACT(o.product_period_snapshot, '$.start_at') >= ?`
      params.push(travelDateFrom)
    }
    if (travelDateTo) {
      query += ` AND JSON_EXTRACT(o.product_period_snapshot, '$.start_at') <= ?`
      params.push(travelDateTo)
    }
    if (bookingDateFrom) {
      query += ` AND DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) >= ?`
      params.push(bookingDateFrom)
    }
    if (bookingDateTo) {
      query += ` AND DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) <= ?`
      params.push(bookingDateTo)
    }

    query += ` GROUP BY supplier_id, supplier_name, country_name ORDER BY supplier_id, order_count DESC`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    // Process data to group by wholesale with country breakdown
    const wholesaleMap = new Map<number, {
      id: number
      name: string
      countries: { [key: string]: number }
      total: number
    }>()

    const countryTotals: { [key: string]: number } = {}
    let totalBookings = 0

    for (const row of rows) {
      const supplierId = parseInt(row.supplier_id) || 0
      const supplierName = row.supplier_name || 'ไม่ระบุ'
      const countryName = row.country_name || 'ไม่ระบุ'
      const orderCount = parseInt(row.order_count) || 0

      // Update wholesale map
      if (!wholesaleMap.has(supplierId)) {
        wholesaleMap.set(supplierId, {
          id: supplierId,
          name: supplierName,
          countries: {},
          total: 0
        })
      }

      const wholesale = wholesaleMap.get(supplierId)!
      wholesale.countries[countryName] = (wholesale.countries[countryName] || 0) + orderCount
      wholesale.total += orderCount

      // Update country totals
      countryTotals[countryName] = (countryTotals[countryName] || 0) + orderCount
      totalBookings += orderCount
    }

    // Convert map to array and sort by total descending
    const wholesales = Array.from(wholesaleMap.values()).sort((a, b) => b.total - a.total)

    // Find top wholesale
    const topWholesale = wholesales.length > 0
      ? { name: wholesales[0].name, count: wholesales[0].total }
      : { name: '', count: 0 }

    // Find top country
    const sortedCountries = Object.entries(countryTotals).sort((a, b) => b[1] - a[1])
    const topCountry = sortedCountries.length > 0
      ? { name: sortedCountries[0][0], count: sortedCountries[0][1] }
      : { name: '', count: 0 }

    const responseData = {
      wholesales,
      summary: {
        total_bookings: totalBookings,
        top_wholesale: topWholesale,
        top_country: topCountry,
        total_partners: wholesales.length
      },
      country_totals: countryTotals
    }

    logApiRequest('GET', '/api/reports/wholesale-by-country', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/wholesale-by-country', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
