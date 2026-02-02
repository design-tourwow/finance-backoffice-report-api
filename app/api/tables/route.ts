import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, TABLE_PREFIXES } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// Database configurations
const DATABASES = [
  {
    key: 'tourwow',
    name: DB_NAMES.TOURWOW,
    prefix: TABLE_PREFIXES.TOURWOW,
    description: 'Orders, Customers, Bookings, Order Items, Installments'
  },
  {
    key: 'locations',
    name: DB_NAMES.LOCATIONS,
    prefix: TABLE_PREFIXES.LOCATIONS,
    description: 'Countries, Provinces, Regions, Continents, Airports'
  },
  {
    key: 'suppliers',
    name: DB_NAMES.SUPPLIERS,
    prefix: TABLE_PREFIXES.SUPPLIERS,
    description: 'Suppliers/Wholesales'
  }
]

// GET /api/tables - List all databases and their tables
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/tables', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/tables', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const results = []

    for (const db of DATABASES) {
      try {
        // Get all tables
        const [tables] = await mysqlPool.execute<RowDataPacket[]>(`
          SELECT
            TABLE_NAME as full_table_name,
            REPLACE(TABLE_NAME, ?, '') as table_name,
            TABLE_TYPE as table_type,
            TABLE_ROWS as table_rows
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME
        `, [db.prefix, db.name])

        results.push({
          database_key: db.key,
          database_name: db.name,
          description: db.description,
          endpoint: `/api/tables/${db.key}`,
          tables: tables.map(t => ({
            table_name: t.table_name,
            endpoint: `/api/tables/${db.key}/${t.table_name}`,
            table_rows: t.table_rows
          })),
          table_count: tables.length
        })
      } catch (dbError: any) {
        results.push({
          database_key: db.key,
          database_name: db.name,
          description: db.description,
          endpoint: `/api/tables/${db.key}`,
          tables: [],
          table_count: 0,
          error: dbError.message
        })
      }
    }

    const totalTables = results.reduce((sum, db) => sum + db.table_count, 0)

    logApiRequest('GET', '/api/tables', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        databases: results,
        summary: {
          total_databases: results.length,
          total_tables: totalTables
        }
      },
      usage: {
        list_all: '/api/tables',
        list_database: '/api/tables/{database}',
        query_table: '/api/tables/{database}/{table}',
        example_endpoints: [
          '/api/tables/tourwow/orders',
          '/api/tables/tourwow/order_items',
          '/api/tables/tourwow/customers',
          '/api/tables/locations/countries',
          '/api/tables/suppliers/suppliers'
        ]
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/tables', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
