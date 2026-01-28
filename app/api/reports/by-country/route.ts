import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/by-country - รายงาน Orders แยกตามประเทศ
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/by-country', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/reports/by-country', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const countryIdParam = searchParams.get('country_id')
    const travelDateFrom = searchParams.get('travel_date_from')
    const travelDateTo = searchParams.get('travel_date_to')
    const bookingDateFrom = searchParams.get('booking_date_from')
    const bookingDateTo = searchParams.get('booking_date_to')
    const supplierIdParam = searchParams.get('supplier_id')

    // Parse comma-separated IDs
    const countryIds = countryIdParam ? countryIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
    const supplierIds = supplierIdParam ? supplierIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []

    let query = `
      SELECT 
        JSON_EXTRACT(product_snapshot, '$.countries[0].id') as country_id,
        JSON_UNQUOTE(JSON_EXTRACT(product_snapshot, '$.countries[0].name_th')) as country_name,
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_id) as total_customers,
        COALESCE(SUM(net_amount), 0) as total_net_amount,
        COALESCE(AVG(net_amount), 0) as avg_net_amount
      FROM v_Xqc7k7_orders
      WHERE order_status != 'Canceled'
        AND deleted_at IS NULL
        AND JSON_EXTRACT(product_snapshot, '$.countries[0].id') IS NOT NULL
    `
    const params: any[] = []

    // Filter by country_id (support multiple IDs)
    if (countryIds.length > 0) {
      const placeholders = countryIds.map(() => '?').join(',')
      query += ` AND CAST(JSON_EXTRACT(product_snapshot, '$.countries[0].id') AS UNSIGNED) IN (${placeholders})`
      params.push(...countryIds)
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
    
    // Filter by supplier_id (support multiple IDs)
    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map(() => '?').join(',')
      query += ` AND product_owner_supplier_id IN (${placeholders})`
      params.push(...supplierIds)
    }

    query += ` GROUP BY country_id, country_name ORDER BY total_orders DESC`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    const data = rows.map(row => ({
      country_id: parseInt(row.country_id) || 0,
      country_name: row.country_name || '',
      total_orders: parseInt(row.total_orders) || 0,
      total_customers: parseInt(row.total_customers) || 0,
      total_net_amount: parseFloat(row.total_net_amount) || 0,
      avg_net_amount: parseFloat(row.avg_net_amount) || 0
    }))

    logApiRequest('GET', '/api/reports/by-country', 200, apiKey)
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/by-country', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
