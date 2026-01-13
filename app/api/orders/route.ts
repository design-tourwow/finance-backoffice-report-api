import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// Middleware to check API key
function checkApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
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

// GET /api/orders - Get orders with filters
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  // Rate limiting
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/orders', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  if (!checkApiKey(request)) {
    logApiRequest('GET', '/api/orders', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    const orderCode = searchParams.get('order_code')
    const customerId = searchParams.get('customer_id')
    const orderStatus = searchParams.get('order_status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    let query = 'SELECT * FROM Xqc7k7_orders WHERE 1=1'
    const params: any[] = []

    if (orderId) {
      query += ' AND id = ?'
      params.push(orderId)
    }

    if (orderCode) {
      query += ' AND order_code = ?'
      params.push(orderCode)
    }

    if (customerId) {
      query += ' AND customer_id = ?'
      params.push(customerId)
    }

    if (orderStatus) {
      query += ' AND order_status = ?'
      params.push(orderStatus)
    }

    query += ' AND deleted_at IS NULL'
    query += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    logApiRequest('GET', '/api/orders', 200, apiKey)
    return NextResponse.json(
      {
        success: true,
        data: rows,
        pagination: {
          limit,
          offset,
          returned: rows.length
        }
      },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    )
  } catch (error: any) {
    logApiRequest('GET', '/api/orders', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('POST', '/api/orders', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Required fields validation
    const requiredFields = [
      'agcy_agency_id', 'order_code_prefix', 'order_code_number', 'order_code',
      'order_status', 'product_owner_supplier_id', 'product_id', 'product_snapshot',
      'product_period_snapshot', 'amount', 'amount_with_discount', 'use_vat',
      'vat_percentage', 'vat', 'net_amount', 'commission_company', 'commission_seller',
      'sum_supplier_order_installment_amount', 'sum_customer_order_installment_amount',
      'customer_name', 'customer_phone_number'
    ]

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const fields = Object.keys(body).join(', ')
    const placeholders = Object.keys(body).map(() => '?').join(', ')
    const values = Object.values(body)

    const query = `INSERT INTO Xqc7k7_orders (${fields}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    logApiRequest('POST', '/api/orders', 201, apiKey)
    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...body }
    }, { status: 201 })
  } catch (error: any) {
    logApiRequest('POST', '/api/orders', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/orders - Update an order
export async function PUT(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('PUT', '/api/orders', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      )
    }

    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ')
    const values = [...Object.values(updateData), id]

    const query = `UPDATE Xqc7k7_orders SET ${setClause}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    logApiRequest('PUT', '/api/orders', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: { id, ...updateData }
    })
  } catch (error: any) {
    logApiRequest('PUT', '/api/orders', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/orders - Soft delete an order
export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('DELETE', '/api/orders', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      )
    }

    const query = 'UPDATE Xqc7k7_orders SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL'
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [id])

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    logApiRequest('DELETE', '/api/orders', 200, apiKey)
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error: any) {
    logApiRequest('DELETE', '/api/orders', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
