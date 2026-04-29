import { NextRequest, NextResponse } from 'next/server'
import { mysqlPool } from '@/lib/db'
import { withApiGuard } from '@/lib/api-guard'
import { RowDataPacket } from 'mysql2'

// GET /api/customers/search?q=xxx&limit=20
// Autocomplete endpoint for customer-name filters. Returns { id, name, code,
// phone } tuples matching the query prefix/contains. Used by the shared
// SharedFilterSearchInput fetchFn on pages that filter by customer.
export const GET = withApiGuard('/api/customers/search', async (request) => {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const limitParam = parseInt(searchParams.get('limit') || '20', 10)
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 20, 1), 50)

  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  // Only return customers who actually have at least one order — the
  // filter is only useful for customers that appear in reports. Restrict
  // to orders that are not soft-deleted to keep the list tight.
  // LIMIT inlined after server-side clamp (1–50) above; the LIKE param
  // is still bound so the user input is escaped safely.
  const query = `
    SELECT
      c.id            AS id,
      c.name          AS name,
      c.customer_code AS code,
      c.phone_number  AS phone
    FROM v_Xqc7k7_customers c
    WHERE c.name LIKE ?
      AND EXISTS (
        SELECT 1 FROM v_Xqc7k7_orders o
        WHERE o.customer_id = c.id AND o.deleted_at IS NULL
      )
    ORDER BY c.name ASC
    LIMIT ${limit}
  `
  const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [`%${q}%`])

  const data = rows.map(row => ({
    id:    parseInt(row.id) || 0,
    name:  row.name  || '',
    code:  row.code  || '',
    phone: row.phone || ''
  }))

  return NextResponse.json({ success: true, data })
}, { roles: ['admin', 'ts', 'crm'] })
