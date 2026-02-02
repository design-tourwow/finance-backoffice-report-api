import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// GET /api/installments - Get customer order installments
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/installments', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('GET', '/api/installments', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const installmentId = searchParams.get('id')
    const orderId = searchParams.get('order_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    let query = 'SELECT * FROM v_Xqc7k7_customer_order_installments WHERE 1=1'
    const params: any[] = []

    if (installmentId) {
      query += ' AND id = ?'
      params.push(installmentId)
    }

    if (orderId) {
      query += ' AND order_id = ?'
      params.push(orderId)
    }

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    // Parse JSON fields (customer_order_installment_snapshot)
    const parsedRows = rows.map(row => {
      const parsed = { ...row }
      
      if (parsed.customer_order_installment_snapshot && typeof parsed.customer_order_installment_snapshot === 'string') {
        try {
          parsed.customer_order_installment_snapshot = JSON.parse(parsed.customer_order_installment_snapshot)
        } catch (e) {
          // Keep as string if parse fails
        }
      }
      
      return parsed
    })

    logApiRequest('GET', '/api/installments', 200, apiKey)
    return NextResponse.json(
      {
        success: true,
        data: parsedRows,
        pagination: {
          limit,
          offset,
          returned: parsedRows.length
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
    logApiRequest('GET', '/api/installments', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/installments - Create a new installment
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('POST', '/api/installments', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Required fields validation
    const requiredFields = ['order_id', 'ordinal', 'status', 'amount']

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Set default value for payment_is_in_progress if not provided
    if (body.payment_is_in_progress === undefined) {
      body.payment_is_in_progress = 0
    }

    const fields = Object.keys(body).join(', ')
    const placeholders = Object.keys(body).map(() => '?').join(', ')
    const values = Object.values(body)

    const query = `INSERT INTO v_Xqc7k7_customer_order_installments (${fields}) VALUES (${placeholders})`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    logApiRequest('POST', '/api/installments', 201, apiKey)
    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...body }
    }, { status: 201 })
  } catch (error: any) {
    logApiRequest('POST', '/api/installments', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/installments - Update an installment
export async function PUT(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('PUT', '/api/installments', 401, apiKey, 'Invalid API key')
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

    const query = `UPDATE v_Xqc7k7_customer_order_installments SET ${setClause} WHERE id = ?`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Installment not found' },
        { status: 404 }
      )
    }

    logApiRequest('PUT', '/api/installments', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: { id, ...updateData }
    })
  } catch (error: any) {
    logApiRequest('PUT', '/api/installments', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/installments - Delete an installment
export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('DELETE', '/api/installments', 401, apiKey, 'Invalid API key')
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

    const query = 'DELETE FROM v_Xqc7k7_customer_order_installments WHERE id = ?'
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [id])

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Installment not found' },
        { status: 404 }
      )
    }

    logApiRequest('DELETE', '/api/installments', 200, apiKey)
    return NextResponse.json({
      success: true,
      message: 'Installment deleted successfully'
    })
  } catch (error: any) {
    logApiRequest('DELETE', '/api/installments', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
