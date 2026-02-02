import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool, DB_NAMES, TABLE_PREFIXES } from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET /api/docs/tables - Get all tables for API documentation (no auth required)
export async function GET(request: NextRequest) {
  try {
    const results: any[] = []

    // Define databases
    const databases = [
      { name: DB_NAMES.TOURWOW, prefix: TABLE_PREFIXES.TOURWOW, key: 'TOURWOW', description: 'ข้อมูลหลัก: Orders, Customers, Bookings, Order Items, Installments' },
      { name: DB_NAMES.LOCATIONS, prefix: TABLE_PREFIXES.LOCATIONS, key: 'LOCATIONS', description: 'ข้อมูลสถานที่: Countries, Provinces, Regions' },
      { name: DB_NAMES.SUPPLIERS, prefix: TABLE_PREFIXES.SUPPLIERS, key: 'SUPPLIERS', description: 'ข้อมูล Suppliers/Wholesales' }
    ]

    for (const db of databases) {
      try {
        // Get all tables
        const [tables] = await mysqlPool.execute<RowDataPacket[]>(`
          SELECT
            TABLE_NAME as table_name,
            TABLE_TYPE as table_type,
            TABLE_ROWS as table_rows,
            TABLE_COMMENT as table_comment
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME
        `, [db.name])

        const tableList: any[] = []

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
              COLUMN_COMMENT as column_comment
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
          `, [db.name, table.table_name])

          tableList.push({
            table_name: table.table_name,
            table_type: table.table_type,
            table_rows: table.table_rows,
            table_comment: table.table_comment || '',
            columns: columns.map(col => ({
              name: col.column_name,
              type: col.data_type,
              full_type: col.column_type,
              nullable: col.is_nullable === 'YES',
              key: col.column_key || null,
              default: col.column_default,
              comment: col.column_comment || ''
            })),
            column_count: columns.length
          })
        }

        results.push({
          database_key: db.key,
          database_name: db.name,
          prefix: db.prefix,
          description: db.description,
          tables: tableList,
          table_count: tableList.length
        })
      } catch (dbError: any) {
        results.push({
          database_key: db.key,
          database_name: db.name,
          prefix: db.prefix,
          description: db.description,
          tables: [],
          table_count: 0,
          error: dbError.message
        })
      }
    }

    // Calculate summary
    const totalTables = results.reduce((sum, db) => sum + db.table_count, 0)
    const totalColumns = results.reduce((sum, db) =>
      sum + db.tables.reduce((tSum: number, t: any) => tSum + t.column_count, 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        databases: results,
        summary: {
          total_databases: results.length,
          total_tables: totalTables,
          total_columns: totalColumns,
          generated_at: new Date().toISOString()
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
