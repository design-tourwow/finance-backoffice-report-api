import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/order-items - ดึงข้อมูล order_items
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/order-items', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  // Authenticate
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('GET', '/api/order-items', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parameters
    const orderId = searchParams.get('order_id')
    const productRoomTypeIdNotNull = searchParams.get('product_room_type_id_not_null') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = `SELECT * FROM v_Xqc7k7_order_items WHERE 1=1`
    const params: any[] = []

    if (orderId) {
      query += ` AND order_id = ?`
      params.push(orderId)
    }

    if (productRoomTypeIdNotNull) {
      query += ` AND product_room_type_id IS NOT NULL`
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM v_Xqc7k7_order_items WHERE 1=1`
    const countParams: any[] = []
    if (orderId) {
      countQuery += ` AND order_id = ?`
      countParams.push(orderId)
    }
    if (productRoomTypeIdNotNull) {
      countQuery += ` AND product_room_type_id IS NOT NULL`
    }
    const [countResult] = await mysqlPool.execute<RowDataPacket[]>(countQuery, countParams)
    const total = countResult[0].total

    logApiRequest('GET', '/api/order-items', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit,
        offset,
        returned: rows.length,
        has_more: offset + rows.length < total
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/order-items', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
