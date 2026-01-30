import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/available-periods - ดึงช่วงเวลาที่มีข้อมูลใน database
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/available-periods', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/reports/available-periods', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    // Query to get available years, quarters, and months from orders
    // Using created_at (booking date) as the reference
    const query = `
      SELECT
        YEAR(CONVERT_TZ(created_at, '+00:00', '+07:00')) as year_ce,
        YEAR(CONVERT_TZ(created_at, '+00:00', '+07:00')) + 543 as year_be,
        QUARTER(CONVERT_TZ(created_at, '+00:00', '+07:00')) as quarter,
        MONTH(CONVERT_TZ(created_at, '+00:00', '+07:00')) as month,
        COUNT(*) as order_count
      FROM v_Xqc7k7_orders
      WHERE order_status != 'Canceled'
        AND deleted_at IS NULL
      GROUP BY year_ce, year_be, quarter, month
      ORDER BY year_ce DESC, month DESC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query)

    // Process data to group by year
    const yearsMap = new Map<number, {
      year_ce: number
      year_be: number
      quarters: Set<number>
      months: Set<number>
      total_orders: number
    }>()

    rows.forEach((row: any) => {
      const yearCE = parseInt(row.year_ce)
      const yearBE = parseInt(row.year_be)
      const quarter = parseInt(row.quarter)
      const month = parseInt(row.month)
      const orderCount = parseInt(row.order_count)

      if (!yearsMap.has(yearCE)) {
        yearsMap.set(yearCE, {
          year_ce: yearCE,
          year_be: yearBE,
          quarters: new Set(),
          months: new Set(),
          total_orders: 0
        })
      }

      const yearData = yearsMap.get(yearCE)!
      yearData.quarters.add(quarter)
      yearData.months.add(month)
      yearData.total_orders += orderCount
    })

    // Convert to array format
    const years = Array.from(yearsMap.values())
      .sort((a, b) => b.year_ce - a.year_ce)
      .map(year => ({
        year_ce: year.year_ce,
        year_be: year.year_be,
        label: `${year.year_be}`, // พ.ศ.
        quarters: Array.from(year.quarters).sort((a, b) => a - b).map(q => ({
          quarter: q,
          label: `ไตรมาส ${q}`,
          // Calculate month range for quarter
          start_month: (q - 1) * 3 + 1,
          end_month: q * 3
        })),
        months: Array.from(year.months).sort((a, b) => a - b).map(m => ({
          month: m,
          label: getThaiMonthName(m),
          label_short: getThaiMonthNameShort(m)
        })),
        total_orders: year.total_orders
      }))

    logApiRequest('GET', '/api/reports/available-periods', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        years,
        summary: {
          total_years: years.length,
          earliest_year: years.length > 0 ? years[years.length - 1].year_be : null,
          latest_year: years.length > 0 ? years[0].year_be : null
        }
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/available-periods', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to get Thai month name
function getThaiMonthName(month: number): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  return months[month - 1] || ''
}

// Helper function to get short Thai month name
function getThaiMonthNameShort(month: number): string {
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
    'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
    'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ]
  return months[month - 1] || ''
}
