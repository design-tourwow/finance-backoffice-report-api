import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// GET /api/customers - Get customers with filters
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/customers', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/customers', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')
    const customerCode = searchParams.get('customer_code')
    const name = searchParams.get('name')
    const phoneNumber = searchParams.get('phone_number')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    let query = 'SELECT * FROM Xqc7k7_customers WHERE 1=1'
    const params: any[] = []

    if (customerId) {
      query += ' AND id = ?'
      params.push(customerId)
    }

    if (customerCode) {
      query += ' AND customer_code = ?'
      params.push(customerCode)
    }

    if (name) {
      query += ' AND name LIKE ?'
      params.push(`%${name}%`)
    }

    if (phoneNumber) {
      query += ' AND phone_number = ?'
      params.push(phoneNumber)
    }

    query += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    logApiRequest('GET', '/api/customers', 200, apiKey)
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
    logApiRequest('GET', '/api/customers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('POST', '/api/customers', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Required fields validation
    const requiredFields = [
      'customer_code_prefix', 'customer_code_number', 'customer_code',
      'name', 'phone_number'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const fields = Object.keys(body).join(', ')
    const placeholders = Object.keys(body).map(() => '?').join(', ')
    const values = Object.values(body)

    const query = `INSERT INTO Xqc7k7_customers (${fields}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    logApiRequest('POST', '/api/customers', 201, apiKey)
    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...body }
    }, { status: 201 })
  } catch (error: any) {
    logApiRequest('POST', '/api/customers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/customers - Update a customer
export async function PUT(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('PUT', '/api/customers', 401, apiKey, 'Invalid API key')
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

    const query = `UPDATE Xqc7k7_customers SET ${setClause}, updated_at = NOW() WHERE id = ?`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    logApiRequest('PUT', '/api/customers', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: { id, ...updateData }
    })
  } catch (error: any) {
    logApiRequest('PUT', '/api/customers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/customers - Delete a customer
export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('DELETE', '/api/customers', 401, apiKey, 'Invalid API key')
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

    const query = 'DELETE FROM Xqc7k7_customers WHERE id = ?'
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [id])

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    logApiRequest('DELETE', '/api/customers', 200, apiKey)
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error: any) {
    logApiRequest('DELETE', '/api/customers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
