import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { RowDataPacket } from 'mysql2'
import { formatFullDate } from '@/lib/dateFormatter'

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

// GET /api/reports/lead-time-analysis - วิเคราะห์ช่วงเวลาจอง (Lead Time)
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/lead-time-analysis', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/reports/lead-time-analysis', 401, apiKey, 'Invalid API key')
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
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Parse comma-separated IDs
    const countryIds = countryIdParam ? countryIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
    const supplierIds = supplierIdParam ? supplierIdParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []

    // Build WHERE clause for filters
    let whereClause = `
      WHERE o.order_status != 'Canceled'
        AND o.deleted_at IS NULL
        AND o.product_period_snapshot IS NOT NULL
        AND JSON_EXTRACT(o.product_period_snapshot, '$.start_at') IS NOT NULL
    `
    const params: any[] = []

    if (countryIds.length > 0) {
      const placeholders = countryIds.map(() => '?').join(',')
      whereClause += ` AND CAST(JSON_EXTRACT(o.product_snapshot, '$.countries[0].id') AS UNSIGNED) IN (${placeholders})`
      params.push(...countryIds)
    }

    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map(() => '?').join(',')
      whereClause += ` AND o.product_owner_supplier_id IN (${placeholders})`
      params.push(...supplierIds)
    }

    if (travelDateFrom) {
      whereClause += ` AND JSON_EXTRACT(o.product_period_snapshot, '$.start_at') >= ?`
      params.push(travelDateFrom)
    }
    if (travelDateTo) {
      whereClause += ` AND JSON_EXTRACT(o.product_period_snapshot, '$.start_at') <= ?`
      params.push(travelDateTo)
    }
    if (bookingDateFrom) {
      whereClause += ` AND DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) >= ?`
      params.push(bookingDateFrom)
    }
    if (bookingDateTo) {
      whereClause += ` AND DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) <= ?`
      params.push(bookingDateTo)
    }

    // Query 1: Get detailed order data with lead time
    const detailQuery = `
      SELECT 
        o.id as order_id,
        o.order_code,
        o.customer_id,
        c.name as customer_name,
        c.customer_code,
        CAST(JSON_EXTRACT(o.product_snapshot, '$.countries[0].id') AS UNSIGNED) as country_id,
        JSON_UNQUOTE(JSON_EXTRACT(o.product_snapshot, '$.countries[0].name_th')) as country_name,
        o.product_owner_supplier_id as supplier_id,
        s.name_th as supplier_name,
        CONVERT_TZ(o.created_at, '+00:00', '+07:00') as created_at_utc,
        JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')) as travel_start_date_raw,
        JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.end_at')) as travel_end_date_raw,
        DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')), '%Y-%m-%d'),
          DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00'))
        ) as lead_time_days,
        o.net_amount
      FROM Xqc7k7_orders o
      LEFT JOIN Xqc7k7_customers c ON o.customer_id = c.id
      LEFT JOIN tw_suppliers_db.GsF2WeS_suppliers s ON o.product_owner_supplier_id = s.id
      ${whereClause}
      ORDER BY lead_time_days DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [detailRows] = await mysqlPool.execute<RowDataPacket[]>(detailQuery, params)

    // Query 2: Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_orders,
        ROUND(AVG(lead_time_days), 1) as avg_lead_time,
        MIN(lead_time_days) as min_lead_time,
        MAX(lead_time_days) as max_lead_time,
        COALESCE(SUM(net_amount), 0) as total_net_amount
      FROM (
        SELECT 
          DATEDIFF(
            STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')), '%Y-%m-%d'),
            DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00'))
          ) as lead_time_days,
          o.net_amount
        FROM Xqc7k7_orders o
        ${whereClause}
      ) as lead_times
    `

    const [summaryRows] = await mysqlPool.execute<RowDataPacket[]>(summaryQuery, params)
    const summary = summaryRows[0]

    // Query 3: Get median (using a workaround for MySQL < 8.0)
    const medianQuery = `
      SELECT lead_time_days
      FROM (
        SELECT 
          DATEDIFF(
            STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')), '%Y-%m-%d'),
            DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00'))
          ) as lead_time_days,
          @rownum := @rownum + 1 as row_num,
          @total_rows := @rownum
        FROM Xqc7k7_orders o, (SELECT @rownum := 0) r
        ${whereClause}
        ORDER BY lead_time_days
      ) as sorted
      WHERE row_num IN (FLOOR((@total_rows + 1) / 2), FLOOR((@total_rows + 2) / 2))
    `

    const [medianRows] = await mysqlPool.execute<RowDataPacket[]>(medianQuery, params)
    const median_lead_time = medianRows.length > 0 
      ? medianRows.reduce((sum, row) => sum + row.lead_time_days, 0) / medianRows.length 
      : 0

    // Query 4: Get distribution by ranges
    const distributionQuery = `
      SELECT 
        range_key,
        range_label,
        min_days,
        max_days,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Xqc7k7_orders o ${whereClause}), 1) as percentage,
        COALESCE(SUM(net_amount), 0) as total_net_amount,
        ROUND(AVG(net_amount), 0) as avg_net_amount
      FROM (
        SELECT 
          CASE 
            WHEN lead_time_days BETWEEN 0 AND 7 THEN '0-7'
            WHEN lead_time_days BETWEEN 8 AND 14 THEN '8-14'
            WHEN lead_time_days BETWEEN 15 AND 30 THEN '15-30'
            WHEN lead_time_days BETWEEN 31 AND 60 THEN '31-60'
            WHEN lead_time_days BETWEEN 61 AND 90 THEN '61-90'
            ELSE '90+'
          END as range_key,
          CASE 
            WHEN lead_time_days BETWEEN 0 AND 7 THEN '0-7 วัน (จองใกล้วันเดินทาง)'
            WHEN lead_time_days BETWEEN 8 AND 14 THEN '8-14 วัน'
            WHEN lead_time_days BETWEEN 15 AND 30 THEN '15-30 วัน'
            WHEN lead_time_days BETWEEN 31 AND 60 THEN '31-60 วัน'
            WHEN lead_time_days BETWEEN 61 AND 90 THEN '61-90 วัน'
            ELSE 'มากกว่า 90 วัน (จองล่วงหน้ามาก)'
          END as range_label,
          CASE 
            WHEN lead_time_days BETWEEN 0 AND 7 THEN 0
            WHEN lead_time_days BETWEEN 8 AND 14 THEN 8
            WHEN lead_time_days BETWEEN 15 AND 30 THEN 15
            WHEN lead_time_days BETWEEN 31 AND 60 THEN 31
            WHEN lead_time_days BETWEEN 61 AND 90 THEN 61
            ELSE 91
          END as min_days,
          CASE 
            WHEN lead_time_days BETWEEN 0 AND 7 THEN 7
            WHEN lead_time_days BETWEEN 8 AND 14 THEN 14
            WHEN lead_time_days BETWEEN 15 AND 30 THEN 30
            WHEN lead_time_days BETWEEN 31 AND 60 THEN 60
            WHEN lead_time_days BETWEEN 61 AND 90 THEN 90
            ELSE NULL
          END as max_days,
          net_amount
        FROM (
          SELECT 
            DATEDIFF(
              STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(o.product_period_snapshot, '$.start_at')), '%Y-%m-%d'),
              DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00'))
            ) as lead_time_days,
            o.net_amount
          FROM Xqc7k7_orders o
          ${whereClause}
        ) as lead_times
      ) as categorized
      GROUP BY range_key, range_label, min_days, max_days
      ORDER BY 
        CASE range_key
          WHEN '0-7' THEN 1
          WHEN '8-14' THEN 2
          WHEN '15-30' THEN 3
          WHEN '31-60' THEN 4
          WHEN '61-90' THEN 5
          WHEN '90+' THEN 6
        END
    `

    const [distributionRows] = await mysqlPool.execute<RowDataPacket[]>(distributionQuery, params)

    // Format response data with Thai Buddhist calendar (numeric format)
    const data = detailRows.map(row => {
      return {
        order_id: parseInt(row.order_id) || 0,
        order_code: row.order_code || '',
        customer_id: parseInt(row.customer_id) || 0,
        customer_name: row.customer_name || '',
        customer_code: row.customer_code || '',
        country_id: parseInt(row.country_id) || 0,
        country_name: row.country_name || '',
        supplier_id: parseInt(row.supplier_id) || 0,
        supplier_name: row.supplier_name || '',
        created_at: formatFullDate(row.created_at_utc),
        travel_start_date: formatFullDate(row.travel_start_date_raw),
        travel_end_date: formatFullDate(row.travel_end_date_raw),
        lead_time_days: parseInt(row.lead_time_days) || 0,
        net_amount: parseFloat(row.net_amount) || 0
      }
    })

    const distribution = distributionRows.map(row => ({
      range: row.range_key,
      range_label: row.range_label,
      min_days: parseInt(row.min_days) || 0,
      max_days: row.max_days ? parseInt(row.max_days) : null,
      count: parseInt(row.count) || 0,
      percentage: parseFloat(row.percentage) || 0,
      total_net_amount: parseFloat(row.total_net_amount) || 0,
      avg_net_amount: parseFloat(row.avg_net_amount) || 0
    }))

    const totalOrders = parseInt(summary.total_orders) || 0

    logApiRequest('GET', '/api/reports/lead-time-analysis', 200, apiKey)
    return NextResponse.json({
      success: true,
      data,
      summary: {
        total_orders: totalOrders,
        avg_lead_time: parseFloat(summary.avg_lead_time) || 0,
        min_lead_time: parseInt(summary.min_lead_time) || 0,
        max_lead_time: parseInt(summary.max_lead_time) || 0,
        median_lead_time: Math.round(median_lead_time),
        total_net_amount: parseFloat(summary.total_net_amount) || 0
      },
      distribution,
      pagination: {
        total: totalOrders,
        limit,
        offset,
        has_more: offset + limit < totalOrders
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/lead-time-analysis', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
