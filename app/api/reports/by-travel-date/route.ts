import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { RowDataPacket } from 'mysql2'
import { formatMonthLabel, isValidDateFormat, DateFormatType } from '@/lib/dateFormatter'

function checkApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')
  const validKeys = [
    process.env.API_KEY_1,
    process.env.API_KEY_2
  ].filter(Boolean)

  if (process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey) return false
    return validKeys.includes(apiKey)
  }
  return true
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

// GET /api/reports/by-travel-date - รายงาน Orders แยกตามเดือนเดินทาง
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/by-travel-date', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  if (!checkApiKey(request)) {
    logApiRequest('GET', '/api/reports/by-travel-date', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
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
    const dateFormatParam = searchParams.get('date_format') || 'th_full_be_full'

    // Validate date_format parameter
    const dateFormat: DateFormatType = isValidDateFormat(dateFormatParam) 
      ? dateFormatParam as DateFormatType 
      : 'th_full_be_full'

    // Parse comma-separated IDs
    const countryIds = countryIdParam ? countryIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
    const supplierIds = supplierIdParam ? supplierIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []

    let query = `
      SELECT 
        DATE_FORMAT(JSON_UNQUOTE(JSON_EXTRACT(product_period_snapshot, '$.start_at')), '%Y-%m') as travel_month,
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_id) as total_customers,
        COALESCE(SUM(net_amount), 0) as total_net_amount
      FROM Xqc7k7_orders
      WHERE order_status != 'Canceled'
        AND deleted_at IS NULL
        AND JSON_EXTRACT(product_period_snapshot, '$.start_at') IS NOT NULL
    `
    const params: any[] = []

    // Filter by country_id (support multiple IDs)
    if (countryIds.length > 0) {
      const placeholders = countryIds.map(() => '?').join(',')
      query += ` AND CAST(JSON_EXTRACT(product_snapshot, '$.countries[0].id') AS UNSIGNED) IN (${placeholders})`
      params.push(...countryIds)
    }

    // Filter by supplier_id (support multiple IDs)
    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map(() => '?').join(',')
      query += ` AND product_owner_supplier_id IN (${placeholders})`
      params.push(...supplierIds)
    }

    if (travelDateFrom) {
      query += ` AND JSON_EXTRACT(product_period_snapshot, '$.start_at') >= ?`
      params.push(travelDateFrom)
    }
    if (travelDateTo) {
      query += ` AND JSON_EXTRACT(product_period_snapshot, '$.start_at') <= ?`
      params.push(travelDateTo)
    }
    if (bookingDateFrom) {
      query += ` AND DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) >= ?`
      params.push(bookingDateFrom)
    }
    if (bookingDateTo) {
      query += ` AND DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) <= ?`
      params.push(bookingDateTo)
    }

    query += ` GROUP BY travel_month ORDER BY travel_month ASC`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    const data = rows.map(row => {
      return {
        travel_month: row.travel_month,
        travel_month_label: formatMonthLabel(row.travel_month, dateFormat),
        total_orders: parseInt(row.total_orders) || 0,
        total_customers: parseInt(row.total_customers) || 0,
        total_net_amount: parseFloat(row.total_net_amount) || 0
      }
    })

    logApiRequest('GET', '/api/reports/by-travel-date', 200, apiKey)
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/by-travel-date', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
