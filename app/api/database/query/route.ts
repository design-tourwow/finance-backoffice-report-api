import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, VIEW_PREFIXES } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

// Database key mapping
const DB_KEY_MAP: Record<string, { name: string; prefix: string }> = {
  'TOURWOW': { name: DB_NAMES.TOURWOW, prefix: VIEW_PREFIXES.TOURWOW },
  'LOCATIONS': { name: DB_NAMES.LOCATIONS, prefix: VIEW_PREFIXES.LOCATIONS },
  'SUPPLIERS': { name: DB_NAMES.SUPPLIERS, prefix: VIEW_PREFIXES.SUPPLIERS }
}

// Validate table exists in database
async function validateTable(database: string, tableName: string): Promise<boolean> {
  const [rows] = await mysqlPool.execute<RowDataPacket[]>(`
    SELECT COUNT(*) as count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
  `, [database, tableName])
  return rows[0].count > 0
}

// GET /api/database/query - Query any table from any database
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/database/query', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/database/query', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    // Required parameters
    const dbKey = searchParams.get('database')?.toUpperCase()
    const tableName = searchParams.get('table')

    // Optional parameters
    const columns = searchParams.get('columns') // Comma-separated column names
    const whereColumn = searchParams.get('where_column')
    const whereValue = searchParams.get('where_value')
    const whereOperator = searchParams.get('where_operator') || '=' // =, !=, >, <, >=, <=, LIKE
    const orderBy = searchParams.get('order_by')
    const orderDir = searchParams.get('order_dir')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate required parameters
    if (!dbKey || !tableName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: database and table',
          usage: {
            required: {
              database: 'Database key (TOURWOW, LOCATIONS, SUPPLIERS)',
              table: 'Table name (e.g., v_Xqc7k7_orders)'
            },
            optional: {
              columns: 'Comma-separated column names (default: all)',
              where_column: 'Column name for WHERE clause',
              where_value: 'Value for WHERE clause',
              where_operator: 'Operator for WHERE (=, !=, >, <, >=, <=, LIKE)',
              order_by: 'Column name for ORDER BY',
              order_dir: 'ASC or DESC (default: ASC)',
              limit: 'Number of rows (default: 100, max: 1000)',
              offset: 'Offset for pagination (default: 0)'
            }
          }
        },
        { status: 400 }
      )
    }

    // Validate database key
    const dbConfig = DB_KEY_MAP[dbKey]
    if (!dbConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid database key: ${dbKey}`,
          valid_databases: Object.keys(DB_KEY_MAP)
        },
        { status: 400 }
      )
    }

    // Validate table exists
    const tableExists = await validateTable(dbConfig.name, tableName)
    if (!tableExists) {
      // Get list of valid tables
      const [validTables] = await mysqlPool.execute<RowDataPacket[]>(`
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `, [dbConfig.name])

      return NextResponse.json(
        {
          success: false,
          error: `Table not found: ${tableName}`,
          valid_tables: validTables.map(t => t.TABLE_NAME)
        },
        { status: 404 }
      )
    }

    // Validate where operator
    const validOperators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE']
    if (whereColumn && !validOperators.includes(whereOperator)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid operator: ${whereOperator}`,
          valid_operators: validOperators
        },
        { status: 400 }
      )
    }

    // Build SELECT clause
    const selectColumns = columns ? columns.split(',').map(c => c.trim()).join(', ') : '*'

    // Build query
    let query = `SELECT ${selectColumns} FROM ${dbConfig.name}.${tableName}`
    const params: any[] = []

    // Add WHERE clause
    if (whereColumn && whereValue !== null) {
      query += ` WHERE ${whereColumn} ${whereOperator} ?`
      params.push(whereOperator === 'LIKE' ? `%${whereValue}%` : whereValue)
    }

    // Add ORDER BY clause
    if (orderBy) {
      query += ` ORDER BY ${orderBy} ${orderDir}`
    }

    // Add LIMIT and OFFSET
    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    // Execute query
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${dbConfig.name}.${tableName}`
    const countParams: any[] = []
    if (whereColumn && whereValue !== null) {
      countQuery += ` WHERE ${whereColumn} ${whereOperator} ?`
      countParams.push(whereOperator === 'LIKE' ? `%${whereValue}%` : whereValue)
    }
    const [countResult] = await mysqlPool.execute<RowDataPacket[]>(countQuery, countParams)
    const total = countResult[0].total

    logApiRequest('GET', '/api/database/query', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        database: dbConfig.name,
        table: tableName,
        query: {
          columns: columns || '*',
          where: whereColumn ? { column: whereColumn, operator: whereOperator, value: whereValue } : null,
          order_by: orderBy ? { column: orderBy, direction: orderDir } : null
        }
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
    logApiRequest('GET', '/api/database/query', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/database/query - Advanced query with multiple conditions
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('POST', '/api/database/query', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('POST', '/api/database/query', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      database,
      table,
      columns = ['*'],
      where = [],
      order_by = [],
      limit = 100,
      offset = 0
    } = body

    // Validate required parameters
    if (!database || !table) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: database and table',
          usage: {
            database: 'Database key (TOURWOW, LOCATIONS, SUPPLIERS)',
            table: 'Table name',
            columns: ['column1', 'column2'] ,
            where: [
              { column: 'status', operator: '=', value: 'active' },
              { column: 'name', operator: 'LIKE', value: 'john' }
            ],
            order_by: [
              { column: 'created_at', direction: 'DESC' }
            ],
            limit: 100,
            offset: 0
          }
        },
        { status: 400 }
      )
    }

    const dbKey = database.toUpperCase()
    const dbConfig = DB_KEY_MAP[dbKey]
    if (!dbConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid database key: ${dbKey}`,
          valid_databases: Object.keys(DB_KEY_MAP)
        },
        { status: 400 }
      )
    }

    // Validate table exists
    const tableExists = await validateTable(dbConfig.name, table)
    if (!tableExists) {
      return NextResponse.json(
        { success: false, error: `Table not found: ${table}` },
        { status: 404 }
      )
    }

    // Build SELECT clause
    const selectColumns = Array.isArray(columns) ? columns.join(', ') : columns

    // Build query
    let query = `SELECT ${selectColumns} FROM ${dbConfig.name}.${table}`
    const params: any[] = []

    // Build WHERE clause
    if (where.length > 0) {
      const whereClauses = where.map((w: any) => {
        const operator = w.operator || '='
        if (operator === 'LIKE') {
          params.push(`%${w.value}%`)
        } else if (operator === 'IN' && Array.isArray(w.value)) {
          const placeholders = w.value.map(() => '?').join(',')
          params.push(...w.value)
          return `${w.column} IN (${placeholders})`
        } else if (operator === 'IS NULL') {
          return `${w.column} IS NULL`
        } else if (operator === 'IS NOT NULL') {
          return `${w.column} IS NOT NULL`
        } else {
          params.push(w.value)
        }
        return `${w.column} ${operator} ?`
      })
      query += ` WHERE ${whereClauses.join(' AND ')}`
    }

    // Build ORDER BY clause
    if (order_by.length > 0) {
      const orderClauses = order_by.map((o: any) =>
        `${o.column} ${o.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`
      )
      query += ` ORDER BY ${orderClauses.join(', ')}`
    }

    // Add LIMIT and OFFSET
    const safeLimit = Math.min(parseInt(limit) || 100, 1000)
    const safeOffset = parseInt(offset) || 0
    query += ` LIMIT ? OFFSET ?`
    params.push(safeLimit, safeOffset)

    // Execute query
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${dbConfig.name}.${table}`
    const countParams: any[] = []
    if (where.length > 0) {
      const whereClauses = where.map((w: any) => {
        const operator = w.operator || '='
        if (operator === 'LIKE') {
          countParams.push(`%${w.value}%`)
        } else if (operator === 'IN' && Array.isArray(w.value)) {
          const placeholders = w.value.map(() => '?').join(',')
          countParams.push(...w.value)
          return `${w.column} IN (${placeholders})`
        } else if (operator === 'IS NULL') {
          return `${w.column} IS NULL`
        } else if (operator === 'IS NOT NULL') {
          return `${w.column} IS NOT NULL`
        } else {
          countParams.push(w.value)
        }
        return `${w.column} ${operator} ?`
      })
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`
    }
    const [countResult] = await mysqlPool.execute<RowDataPacket[]>(countQuery, countParams)
    const total = countResult[0].total

    logApiRequest('POST', '/api/database/query', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        database: dbConfig.name,
        table,
        query: { columns, where, order_by }
      },
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
        returned: rows.length,
        has_more: safeOffset + rows.length < total
      }
    })
  } catch (error: any) {
    logApiRequest('POST', '/api/database/query', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
