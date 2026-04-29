import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { withApiGuard } from '@/lib/api-guard'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/countries - รายการประเทศทั้งหมดที่มีใน orders
export const GET = withApiGuard('/api/reports/countries', async (request) => {
  try {
    const query = `
      SELECT DISTINCT
        JSON_EXTRACT(product_snapshot, '$.countries[0].id') as id,
        JSON_UNQUOTE(JSON_EXTRACT(product_snapshot, '$.countries[0].name_th')) as name_th,
        JSON_UNQUOTE(JSON_EXTRACT(product_snapshot, '$.countries[0].name_en')) as name_en
      FROM v_Xqc7k7_orders
      WHERE order_status != 'Canceled'
        AND JSON_EXTRACT(product_snapshot, '$.countries[0].id') IS NOT NULL
      ORDER BY name_th ASC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query)

    const data = rows.map(row => ({
      id: parseInt(row.id) || 0,
      name_th: row.name_th || '',
      name_en: row.name_en || ''
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
