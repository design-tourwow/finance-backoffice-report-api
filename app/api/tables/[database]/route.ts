import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, TABLE_PREFIXES } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// Database key mapping
const DB_KEY_MAP: Record<string, { name: string; prefix: string; description: string }> = {
  'tourwow': {
    name: DB_NAMES.TOURWOW,
    prefix: TABLE_PREFIXES.TOURWOW,
    description: 'Orders, Customers, Bookings, Order Items, Installments'
  },
  'locations': {
    name: DB_NAMES.LOCATIONS,
    prefix: TABLE_PREFIXES.LOCATIONS,
    description: 'Countries, Provinces, Regions, Continents, Airports'
  },
  'suppliers': {
    name: DB_NAMES.SUPPLIERS,
    prefix: TABLE_PREFIXES.SUPPLIERS,
    description: 'Suppliers/Wholesales'
  }
}

// GET /api/tables/[database] - List all tables in a database
// Example: /api/tables/tourwow
export async function GET(
  request: NextRequest,
  { params }: { params: { database: string } }
) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { database } = params

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', `/api/tables/${database}`, 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', `/api/tables/${database}`, 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    // Get database config
    const dbConfig = DB_KEY_MAP[database.toLowerCase()]
    if (!dbConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid database: ${database}`,
          valid_databases: Object.keys(DB_KEY_MAP).map(key => ({
            key,
            name: DB_KEY_MAP[key].name,
            description: DB_KEY_MAP[key].description,
            endpoint: `/api/tables/${key}`
          }))
        },
        { status: 400 }
      )
    }

    // Get all tables with their info
    const [tables] = await mysqlPool.execute<RowDataPacket[]>(`
      SELECT
        TABLE_NAME as full_table_name,
        REPLACE(TABLE_NAME, ?, '') as table_name,
        TABLE_TYPE as table_type,
        TABLE_ROWS as table_rows,
        TABLE_COMMENT as table_comment
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.prefix, dbConfig.name])

    const tableList = tables.map(t => ({
      table_name: t.table_name,
      full_table_name: t.full_table_name,
      endpoint: `/api/tables/${database}/${t.table_name}`,
      table_type: t.table_type,
      table_rows: t.table_rows,
      table_comment: t.table_comment || ''
    }))

    logApiRequest('GET', `/api/tables/${database}`, 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        database: dbConfig.name,
        description: dbConfig.description,
        prefix: dbConfig.prefix,
        tables: tableList,
        table_count: tableList.length
      },
      usage: {
        list_tables: `/api/tables/${database}`,
        query_table: `/api/tables/${database}/{table_name}`,
        with_filters: `/api/tables/${database}/{table_name}?limit=10&order_by=id&order_dir=DESC`
      }
    })
  } catch (error: any) {
    logApiRequest('GET', `/api/tables/${database}`, 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
