import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

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

// GET /api/suppliers - Get suppliers with filters
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/suppliers', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  if (!checkApiKey(request)) {
    logApiRequest('GET', '/api/suppliers', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('id')
    const code = searchParams.get('code')
    const nameEn = searchParams.get('name_en')
    const nameTh = searchParams.get('name_th')
    const statusCode = searchParams.get('status_code')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    let query = 'SELECT * FROM tw_suppliers_db.GsF2WeS_suppliers WHERE 1=1'
    const params: any[] = []

    if (supplierId) {
      query += ' AND id = ?'
      params.push(supplierId)
    }

    if (code) {
      query += ' AND code = ?'
      params.push(code)
    }

    if (nameEn) {
      query += ' AND name_en LIKE ?'
      params.push(`%${nameEn}%`)
    }

    if (nameTh) {
      query += ' AND name_th LIKE ?'
      params.push(`%${nameTh}%`)
    }

    if (statusCode) {
      query += ' AND status_code = ?'
      params.push(statusCode)
    }

    query += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    logApiRequest('GET', '/api/suppliers', 200, apiKey)
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
    logApiRequest('GET', '/api/suppliers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('POST', '/api/suppliers', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Set default values
    if (body.status_code === undefined) {
      body.status_code = 1
    }
    if (body.product_pool_ranking === undefined) {
      body.product_pool_ranking = 99
    }

    const fields = Object.keys(body).join(', ')
    const placeholders = Object.keys(body).map(() => '?').join(', ')
    const values = Object.values(body)

    const query = `INSERT INTO tw_suppliers_db.GsF2WeS_suppliers (${fields}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    logApiRequest('POST', '/api/suppliers', 201, apiKey)
    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...body }
    }, { status: 201 })
  } catch (error: any) {
    logApiRequest('POST', '/api/suppliers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers - Update a supplier
export async function PUT(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('PUT', '/api/suppliers', 401, apiKey, 'Invalid API key')
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

    const query = `UPDATE tw_suppliers_db.GsF2WeS_suppliers SET ${setClause}, updated_at = NOW() WHERE id = ?`

    const [result] = await mysqlPool.execute<ResultSetHeader>(query, values)

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    logApiRequest('PUT', '/api/suppliers', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: { id, ...updateData }
    })
  } catch (error: any) {
    logApiRequest('PUT', '/api/suppliers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers - Delete a supplier
export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('DELETE', '/api/suppliers', 401, apiKey, 'Invalid API key')
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

    const query = 'DELETE FROM tw_suppliers_db.GsF2WeS_suppliers WHERE id = ?'
    const [result] = await mysqlPool.execute<ResultSetHeader>(query, [id])

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    logApiRequest('DELETE', '/api/suppliers', 200, apiKey)
    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully'
    })
  } catch (error: any) {
    logApiRequest('DELETE', '/api/suppliers', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
