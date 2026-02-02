import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, VIEW_PREFIXES } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'
import { authenticate } from '@/lib/auth'
import { RowDataPacket } from 'mysql2'

interface ColumnInfo {
  column_name: string
  data_type: string
  column_type: string
  is_nullable: boolean
  column_key: string | null
  column_default: any
  extra: string | null
  column_comment: string
  ordinal_position: number
}

interface TableSchema {
  table_name: string
  table_type: string
  table_rows: number | null
  create_time: string | null
  update_time: string | null
  table_comment: string
  columns: ColumnInfo[]
  column_count: number
}

interface DatabaseSchema {
  database: string
  prefix: string
  description: string
  tables: TableSchema[]
  table_count: number
}

// GET /api/database/schema - Get complete schema of all databases, tables, and columns
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/database/schema', 429, apiKey, 'Rate limit exceeded')
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
    logApiRequest('GET', '/api/database/schema', 401, apiKey, auth.error || 'Authentication failed')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const dbFilter = searchParams.get('database')
    const tableFilter = searchParams.get('table')

    const results: DatabaseSchema[] = []

    // Define databases with descriptions
    const databases = [
      {
        name: DB_NAMES.TOURWOW,
        prefix: VIEW_PREFIXES.TOURWOW,
        key: 'TOURWOW',
        description: 'ข้อมูลหลัก: Orders, Customers, Bookings, Installments'
      },
      {
        name: DB_NAMES.LOCATIONS,
        prefix: VIEW_PREFIXES.LOCATIONS,
        key: 'LOCATIONS',
        description: 'ข้อมูลสถานที่: Countries, Provinces, Regions, Continents, Airports'
      },
      {
        name: DB_NAMES.SUPPLIERS,
        prefix: VIEW_PREFIXES.SUPPLIERS,
        key: 'SUPPLIERS',
        description: 'ข้อมูล Suppliers/Wholesales'
      }
    ]

    for (const db of databases) {
      // Skip if filter is set and doesn't match
      if (dbFilter && dbFilter.toUpperCase() !== db.key && dbFilter !== db.name) {
        continue
      }

      try {
        // Build table query with optional filter
        let tableQuery = `
          SELECT
            TABLE_NAME as table_name,
            TABLE_TYPE as table_type,
            TABLE_ROWS as table_rows,
            CREATE_TIME as create_time,
            UPDATE_TIME as update_time,
            TABLE_COMMENT as table_comment
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ?
        `
        const tableParams: any[] = [db.name]

        if (tableFilter) {
          tableQuery += ` AND TABLE_NAME LIKE ?`
          tableParams.push(`%${tableFilter}%`)
        }

        tableQuery += ` ORDER BY TABLE_NAME`

        const [tables] = await mysqlPool.execute<RowDataPacket[]>(tableQuery, tableParams)

        const tableSchemas: TableSchema[] = []

        for (const table of tables) {
          // Get columns for each table
          const [columns] = await mysqlPool.execute<RowDataPacket[]>(`
            SELECT
              COLUMN_NAME as column_name,
              DATA_TYPE as data_type,
              COLUMN_TYPE as column_type,
              IS_NULLABLE as is_nullable,
              COLUMN_KEY as column_key,
              COLUMN_DEFAULT as column_default,
              EXTRA as extra,
              COLUMN_COMMENT as column_comment,
              ORDINAL_POSITION as ordinal_position
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
          `, [db.name, table.table_name])

          const columnList: ColumnInfo[] = columns.map(col => ({
            column_name: col.column_name,
            data_type: col.data_type,
            column_type: col.column_type,
            is_nullable: col.is_nullable === 'YES',
            column_key: col.column_key || null,
            column_default: col.column_default,
            extra: col.extra || null,
            column_comment: col.column_comment || '',
            ordinal_position: col.ordinal_position
          }))

          tableSchemas.push({
            table_name: table.table_name,
            table_type: table.table_type,
            table_rows: table.table_rows,
            create_time: table.create_time ? new Date(table.create_time).toISOString() : null,
            update_time: table.update_time ? new Date(table.update_time).toISOString() : null,
            table_comment: table.table_comment || '',
            columns: columnList,
            column_count: columnList.length
          })
        }

        results.push({
          database: db.name,
          prefix: db.prefix,
          description: db.description,
          tables: tableSchemas,
          table_count: tableSchemas.length
        })
      } catch (dbError: any) {
        results.push({
          database: db.name,
          prefix: db.prefix,
          description: db.description,
          tables: [],
          table_count: 0,
          error: dbError.message
        } as any)
      }
    }

    // Calculate totals
    const totalTables = results.reduce((sum, db) => sum + db.table_count, 0)
    const totalColumns = results.reduce((sum, db) =>
      sum + db.tables.reduce((tSum, t) => tSum + t.column_count, 0), 0)

    logApiRequest('GET', '/api/database/schema', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: {
        databases: results,
        summary: {
          total_databases: results.length,
          total_tables: totalTables,
          total_columns: totalColumns
        }
      }
    })
  } catch (error: any) {
    logApiRequest('GET', '/api/database/schema', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
