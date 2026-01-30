import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, VIEW_PREFIXES } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/locations/countries - ดึงรายการประเทศทั้งหมด
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
    const continent_id = searchParams.get('continent_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const tableName = `${DB_NAMES.LOCATIONS}.${VIEW_PREFIXES.LOCATIONS}countries`

    let query = `
      SELECT
        id,
        name_th,
        name_en,
        code,
        continent_id,
        created_at,
        updated_at
      FROM ${tableName}
      WHERE 1=1
    `
    const params: any[] = []

    if (continent_id) {
      query += ` AND continent_id = ?`
      params.push(continent_id)
    }

    if (search) {
      query += ` AND (name_th LIKE ? OR name_en LIKE ? OR code LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += ` ORDER BY name_en ASC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await mysqlPool.query<RowDataPacket[]>(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE 1=1`
    const countParams: any[] = []

    if (continent_id) {
      countQuery += ` AND continent_id = ?`
      countParams.push(continent_id)
    }
    if (search) {
      countQuery += ` AND (name_th LIKE ? OR name_en LIKE ? OR code LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const [countResult] = await mysqlPool.query<RowDataPacket[]>(countQuery, countParams)
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total
      }
    })

  } catch (error: any) {
    console.error('❌ Countries API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
