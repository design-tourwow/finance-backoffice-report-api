import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { withApiGuard } from '@/lib/api-guard'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/by-supplier - รายงาน Orders แยกตาม Supplier
export const GET = withApiGuard('/api/reports/by-supplier', async (request) => {
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

    // Query with JOIN to order_items for travelers count
    // Logic: นับเฉพาะ order ที่ไม่ยกเลิก + งวดแรก paid + supplier_commission > 0
    let query = `
      SELECT
        o.product_owner_supplier_id as supplier_id,
        s.name_th as supplier_name,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(oi_sum.traveler_count), 0) as total_customers,
        COALESCE(SUM(o.net_amount), 0) as total_net_amount,
        COALESCE(AVG(o.net_amount), 0) as avg_net_amount
      FROM v_Xqc7k7_orders o
      LEFT JOIN tw_suppliers_db_views.v_GsF2WeS_suppliers s ON o.product_owner_supplier_id = s.id
      LEFT JOIN (
        SELECT order_id, SUM(quantity) as traveler_count
        FROM v_Xqc7k7_order_items
        WHERE product_room_type_id IS NOT NULL
        GROUP BY order_id
      ) oi_sum ON oi_sum.order_id = o.id
      WHERE o.order_status != 'Canceled'
        AND o.supplier_commission > 0
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

    // First installment must be paid (ordinal = 1, status = 'paid')
    query += `
      AND EXISTS (
        SELECT 1 FROM v_Xqc7k7_customer_order_installments ci
        WHERE ci.order_id = o.id AND ci.ordinal = 1 AND ci.status = 'paid'
      )`

    query += ` GROUP BY supplier_id, supplier_name HAVING total_orders > 0 ORDER BY total_orders DESC`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    const data = rows.map(row => ({
      supplier_id: parseInt(row.supplier_id) || 0,
      supplier_name: row.supplier_name || '',
      total_orders: parseInt(row.total_orders) || 0,
      total_customers: parseInt(row.total_customers) || 0,
      total_net_amount: parseFloat(row.total_net_amount) || 0,
      avg_net_amount: parseFloat(row.avg_net_amount) || 0
    }))

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}, { roles: ['admin'] })
