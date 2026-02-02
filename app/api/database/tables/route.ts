import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, VIEW_PREFIXES } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface TableInfo {
  table_name: string
  table_type: string
  table_rows: number | null
  create_time: string | null
  update_time: string | null
  table_comment: string
}

interface DatabaseTables {
  database: string
  prefix: string
  tables: TableInfo[]
  table_count: number
}

// GET /api/database/tables - List all tables from all databases
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/database/tables', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/database/tables', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const dbFilter = searchParams.get('database') // Optional: filter by specific database
    const includeColumns = searchParams.get('include_columns') === 'true' // Optional: include column details

    const results: DatabaseTables[] = []

    // Define databases to query
    const databases = [
      { name: DB_NAMES.TOURWOW, prefix: VIEW_PREFIXES.TOURWOW, key: 'TOURWOW' },
      { name: DB_NAMES.LOCATIONS, prefix: VIEW_PREFIXES.LOCATIONS, key: 'LOCATIONS' },
      { name: DB_NAMES.SUPPLIERS, prefix: VIEW_PREFIXES.SUPPLIERS, key: 'SUPPLIERS' }
    ]

    for (const db of databases) {
      // Skip if filter is set and doesn't match
      if (dbFilter && dbFilter.toUpperCase() !== db.key && dbFilter !== db.name) {
        continue
      }

      try {
        // Query tables from information_schema
        const [tables] = await mysqlPool.execute<RowDataPacket[]>(`
          SELECT
            TABLE_NAME as table_name,
            TABLE_TYPE as table_type,
            TABLE_ROWS as table_rows,
            CREATE_TIME as create_time,
            UPDATE_TIME as update_time,
            TABLE_COMMENT as table_comment
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME
        `, [db.name])

        const tableList: TableInfo[] = tables.map(row => ({
          table_name: row.table_name,
          table_type: row.table_type,
          table_rows: row.table_rows,
          create_time: row.create_time ? new Date(row.create_time).toISOString() : null,
          update_time: row.update_time ? new Date(row.update_time).toISOString() : null,
          table_comment: row.table_comment || ''
        }))

        // If include_columns is true, fetch column details for each table
        if (includeColumns && tableList.length > 0) {
          for (const table of tableList) {
            const [columns] = await mysqlPool.execute<RowDataPacket[]>(`
              SELECT
                COLUMN_NAME as column_name,
                DATA_TYPE as data_type,
                COLUMN_TYPE as column_type,
                IS_NULLABLE as is_nullable,
                COLUMN_KEY as column_key,
                COLUMN_DEFAULT as column_default,
                EXTRA as extra,
                COLUMN_COMMENT as column_comment
              FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
              ORDER BY ORDINAL_POSITION
            `, [db.name, table.table_name])

            ;(table as any).columns = columns.map(col => ({
              column_name: col.column_name,
              data_type: col.data_type,
              column_type: col.column_type,
              is_nullable: col.is_nullable === 'YES',
              column_key: col.column_key || null,
              column_default: col.column_default,
              extra: col.extra || null,
              column_comment: col.column_comment || ''
            }))
          }
        }

        results.push({
          database: db.name,
          prefix: db.prefix,
          tables: tableList,
          table_count: tableList.length
        })
      } catch (dbError: any) {
        // If we can't access this database, add it with error info
        results.push({
          database: db.name,
          prefix: db.prefix,
          tables: [],
          table_count: 0,
          error: dbError.message
        } as any)
      }
    }

    // Calculate totals
    const totalTables = results.reduce((sum, db) => sum + db.table_count, 0)

    logApiRequest('GET', '/api/database/tables', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        databases: results,
        summary: {
          total_databases: results.length,
          total_tables: totalTables
        }
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/database/tables', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
