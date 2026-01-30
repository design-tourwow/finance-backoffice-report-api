import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, VIEW_PREFIXES } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/locations/continents - ดึงรายการทวีปทั้งหมด
export async function GET(request: NextRequest) {
  // Authenticate
  const auth = authenticate(request)
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const tableName = `${DB_NAMES.LOCATIONS}.${VIEW_PREFIXES.LOCATIONS}continents`

    const query = `
      SELECT
        id,
        name_th,
        name_en,
        code,
        created_at,
        updated_at
      FROM ${tableName}
      ORDER BY name_en ASC
    `

    const [rows] = await mysqlPool.query<RowDataPacket[]>(query)

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length
    })

  } catch (error: any) {
    console.error('❌ Continents API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
