import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// GET /api/reports/countries - รายการประเทศทั้งหมดที่มีใน orders
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/reports/countries', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    )
  }

  // Authenticate using JWT or API Key
  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('GET', '/api/reports/countries', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const query = `
      SELECT DISTINCT
        JSON_EXTRACT(product_snapshot, '$.countries[0].id') as id,
        JSON_UNQUOTE(JSON_EXTRACT(product_snapshot, '$.countries[0].name_th')) as name_th,
        JSON_UNQUOTE(JSON_EXTRACT(product_snapshot, '$.countries[0].name_en')) as name_en
      FROM Xqc7k7_orders
      WHERE order_status != 'Canceled'
        AND deleted_at IS NULL
        AND JSON_EXTRACT(product_snapshot, '$.countries[0].id') IS NOT NULL
      ORDER BY name_th ASC
    `

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query)

    const data = rows.map(row => ({
      id: parseInt(row.id) || 0,
      name_th: row.name_th || '',
      name_en: row.name_en || ''
    }))

    logApiRequest('GET', '/api/reports/countries', 200, apiKey)
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/reports/countries', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
