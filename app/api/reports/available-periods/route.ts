import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'
import { formatMonthLabel } from '@/lib/dateFormatter'

// Thai month names (reuse from dateFormatter pattern)
const THAI_MONTHS_FULL: { [key: number]: string } = {
  1: 'มกราคม', 2: 'กุมภาพันธ์', 3: 'มีนาคม',
  4: 'เมษายน', 5: 'พฤษภาคม', 6: 'มิถุนายน',
  7: 'กรกฎาคม', 8: 'สิงหาคม', 9: 'กันยายน',
  10: 'ตุลาคม', 11: 'พฤศจิกายน', 12: 'ธันวาคม'
}

const THAI_MONTHS_SHORT: { [key: number]: string } = {
  1: 'ม.ค.', 2: 'ก.พ.', 3: 'มี.ค.',
  4: 'เม.ย.', 5: 'พ.ค.', 6: 'มิ.ย.',
  7: 'ก.ค.', 8: 'ส.ค.', 9: 'ก.ย.',
  10: 'ต.ค.', 11: 'พ.ย.', 12: 'ธ.ค.'
}

// Convert CE year to BE year
function toBuddhistYear(yearCE: number): number {
  return yearCE + 543
}

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
    // Only get year_ce from database, convert to BE in TypeScript using dateFormatter pattern
    const query = `
      SELECT
        YEAR(CONVERT_TZ(created_at, '+00:00', '+07:00')) as year_ce,
        QUARTER(CONVERT_TZ(created_at, '+00:00', '+07:00')) as quarter,
        MONTH(CONVERT_TZ(created_at, '+00:00', '+07:00')) as month,
        COUNT(*) as order_count
      FROM Xqc7k7_orders
      WHERE order_status != 'Canceled'
        AND deleted_at IS NULL
      GROUP BY year_ce, quarter, month
      ORDER BY year_ce DESC, month DESC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query)

    // Process data to group by year
    const yearsMap = new Map<number, {
      year_ce: number
      quarters: Set<number>
      months: Set<number>
      total_orders: number
    }>()

    rows.forEach((row: any) => {
      const yearCE = parseInt(row.year_ce)
      const quarter = parseInt(row.quarter)
      const month = parseInt(row.month)
      const orderCount = parseInt(row.order_count)

      if (!yearsMap.has(yearCE)) {
        yearsMap.set(yearCE, {
          year_ce: yearCE,
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

    // Convert to array format using dateFormatter pattern for year conversion
    const years = Array.from(yearsMap.values())
      .sort((a, b) => b.year_ce - a.year_ce)
      .map(year => {
        const yearBE = toBuddhistYear(year.year_ce)

        return {
          year_ce: year.year_ce,
          year_be: yearBE,
          label: `${yearBE}`, // พ.ศ.
          quarters: Array.from(year.quarters).sort((a, b) => a - b).map(q => ({
            quarter: q,
            label: `ไตรมาส ${q}`,
            label_with_year: `Q${q}/${yearBE}`,
            start_month: (q - 1) * 3 + 1,
            end_month: q * 3
          })),
          months: Array.from(year.months).sort((a, b) => a - b).map(m => {
            // Use formatMonthLabel for consistent formatting
            const monthStr = `${year.year_ce}-${String(m).padStart(2, '0')}`
            return {
              month: m,
              label: THAI_MONTHS_FULL[m],
              label_short: THAI_MONTHS_SHORT[m],
              label_with_year: formatMonthLabel(monthStr, 'th_short_be_full') // ม.ค. 2568
            }
          }),
          total_orders: year.total_orders
        }
      })

    logApiRequest('GET', '/api/reports/available-periods', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        years,
        summary: {
          total_years: years.length,
          earliest_year_ce: years.length > 0 ? years[years.length - 1].year_ce : null,
          earliest_year_be: years.length > 0 ? years[years.length - 1].year_be : null,
          latest_year_ce: years.length > 0 ? years[0].year_ce : null,
          latest_year_be: years.length > 0 ? years[0].year_be : null
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
