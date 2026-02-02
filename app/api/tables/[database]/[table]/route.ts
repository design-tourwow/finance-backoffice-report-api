import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, TABLE_PREFIXES } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// Database key mapping
const DB_KEY_MAP: Record<string, { name: string; prefix: string }> = {
  'tourwow': { name: DB_NAMES.TOURWOW, prefix: TABLE_PREFIXES.TOURWOW },
  'locations': { name: DB_NAMES.LOCATIONS, prefix: TABLE_PREFIXES.LOCATIONS },
  'suppliers': { name: DB_NAMES.SUPPLIERS, prefix: TABLE_PREFIXES.SUPPLIERS }
}

// GET /api/tables/[database]/[table] - Query any table dynamically
// Example: /api/tables/tourwow/orders
// Example: /api/tables/tourwow/order_items
export async function GET(
  request: NextRequest,
  { params }: { params: { database: string; table: string } }
) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { database, table } = params

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', `/api/tables/${database}/${table}`, 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', `/api/tables/${database}/${table}`, 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    // Get database config
    const dbConfig = DB_KEY_MAP[database.toLowerCase()]
    if (!dbConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid database: ${database}`,
          valid_databases: Object.keys(DB_KEY_MAP),
          usage: '/api/tables/{database}/{table}'
        },
        { status: 400 }
      )
    }

    // Build full table name with prefix
    const fullTableName = `${dbConfig.prefix}${table}`

    // Check if table exists
    const [tableCheck] = await mysqlPool.execute<RowDataPacket[]>(`
      SELECT COUNT(*) as count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `, [dbConfig.name, fullTableName])

    if (tableCheck[0].count === 0) {
      // Get list of valid tables
      const [validTables] = await mysqlPool.execute<RowDataPacket[]>(`
        SELECT REPLACE(TABLE_NAME, ?, '') as table_name
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `, [dbConfig.prefix, dbConfig.name])

      return NextResponse.json(
        {
          success: false,
          error: `Table not found: ${table}`,
          valid_tables: validTables.map(t => t.table_name),
          hint: 'Use table name without prefix (e.g., "orders" not "Xqc7k7_orders")'
        },
        { status: 404 }
      )
    }

    // Parse query parameters
    const columns = searchParams.get('columns') // Comma-separated
    const whereColumn = searchParams.get('where_column')
    const whereValue = searchParams.get('where_value')
    const whereOperator = searchParams.get('where_operator') || '='
    const orderBy = searchParams.get('order_by')
    const orderDir = searchParams.get('order_dir')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build SELECT clause
    const selectColumns = columns ? columns.split(',').map(c => c.trim()).join(', ') : '*'

    // Build query
    let query = `SELECT ${selectColumns} FROM ${dbConfig.name}.${fullTableName}`
    const queryParams: any[] = []

    // Add WHERE clause
    if (whereColumn && whereValue !== null) {
      const validOperators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE']
      const op = validOperators.includes(whereOperator) ? whereOperator : '='
      query += ` WHERE ${whereColumn} ${op} ?`
      queryParams.push(op === 'LIKE' ? `%${whereValue}%` : whereValue)
    }

    // Add ORDER BY clause
    if (orderBy) {
      query += ` ORDER BY ${orderBy} ${orderDir}`
    }

    // Add LIMIT and OFFSET
    query += ` LIMIT ? OFFSET ?`
    queryParams.push(limit, offset)

    // Execute query
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, queryParams)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${dbConfig.name}.${fullTableName}`
    const countParams: any[] = []
    if (whereColumn && whereValue !== null) {
      const op = ['=', '!=', '>', '<', '>=', '<=', 'LIKE'].includes(whereOperator) ? whereOperator : '='
      countQuery += ` WHERE ${whereColumn} ${op} ?`
      countParams.push(op === 'LIKE' ? `%${whereValue}%` : whereValue)
    }
    const [countResult] = await mysqlPool.execute<RowDataPacket[]>(countQuery, countParams)
    const total = countResult[0].total

    logApiRequest('GET', `/api/tables/${database}/${table}`, 200, apiKey)
    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        database: dbConfig.name,
        table: fullTableName,
        endpoint: `/api/tables/${database}/${table}`
      },
      pagination: {
        total,
        limit,
        offset,
        returned: rows.length,
        has_more: offset + rows.length < total
      }
    })
  } catch (error: any) {
    logApiRequest('GET', `/api/tables/${database}/${table}`, 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
