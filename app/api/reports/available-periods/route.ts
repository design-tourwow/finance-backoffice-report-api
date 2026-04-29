import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { withApiGuard } from '@/lib/api-guard'
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
export const GET = withApiGuard('/api/reports/available-periods', async (request) => {
  const { searchParams } = new URL(request.url)
  const parseIdCsv = (value: string | null): number[] => {
    if (!value || value.trim() === '') return []
    return value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n > 0)
  }
  const countryIds = parseIdCsv(searchParams.get('country_id'))
  const supplierIds = parseIdCsv(searchParams.get('supplier_id'))

  try {
    // Query to get available years, quarters, and months from orders
    // Using created_at (booking date) as the reference
    // Only get year_ce from database, convert to BE in TypeScript using dateFormatter pattern
    const whereClauses: string[] = [`order_status != 'Canceled'`]
    const params: (number | string)[] = []

    if (countryIds.length > 0) {
      const orCountry = countryIds
        .map(() => `JSON_CONTAINS(JSON_EXTRACT(product_snapshot, '$.countries'), JSON_OBJECT('id', ?))`)
        .join(' OR ')
      whereClauses.push(
        `product_snapshot IS NOT NULL AND product_snapshot != '' AND JSON_VALID(product_snapshot) = 1 AND JSON_TYPE(JSON_EXTRACT(product_snapshot, '$.countries')) = 'ARRAY' AND (${orCountry})`
      )
      for (const id of countryIds) params.push(id)
    }

    if (supplierIds.length > 0) {
      const placeholders = supplierIds.map(() => '?').join(',')
      whereClauses.push(`product_owner_supplier_id IN (${placeholders})`)
      for (const id of supplierIds) params.push(id)
    }

    const query = `
      SELECT
        YEAR(CONVERT_TZ(created_at, '+00:00', '+07:00')) as year_ce,
        QUARTER(CONVERT_TZ(created_at, '+00:00', '+07:00')) as quarter,
        MONTH(CONVERT_TZ(created_at, '+00:00', '+07:00')) as month,
        COUNT(*) as order_count
      FROM v_Xqc7k7_orders
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY year_ce, quarter, month
      ORDER BY year_ce DESC, month DESC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}, { roles: ['admin', 'ts', 'crm'] })
