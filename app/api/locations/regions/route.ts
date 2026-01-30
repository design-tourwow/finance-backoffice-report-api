import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, VIEW_PREFIXES } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/locations/regions - ดึงรายการภูมิภาคทั้งหมด
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
    const { searchParams } = new URL(request.url)
    const country_id = searchParams.get('country_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const tableName = `${DB_NAMES.LOCATIONS}.${VIEW_PREFIXES.LOCATIONS}regions`

    let query = `
      SELECT
        id,
        name_th,
        name_en,
        country_id,
        created_at,
        updated_at
      FROM ${tableName}
      WHERE 1=1
    `
    const params: any[] = []

    if (country_id) {
      query += ` AND country_id = ?`
      params.push(country_id)
    }

    query += ` ORDER BY name_en ASC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await mysqlPool.query<RowDataPacket[]>(query, params)

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        limit,
        offset,
        count: rows.length
      }
    })

  } catch (error: any) {
    console.error('❌ Regions API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
