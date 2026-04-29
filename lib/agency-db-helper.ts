import { mysqlPool } from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// Discover which database schema actually contains the agency-members view.
// The schema name varies across environments (different MySQL hosts mount it
// differently), so route handlers must look it up at request time before
// joining `v_6kMWFc_agcy_agency_members`. Returns null when the view isn't
// reachable so callers can degrade to id-only seller display.
//
// Cached for the lifetime of the lambda warm container — schema discovery
// is stable per environment, so we don't re-query INFORMATION_SCHEMA on
// every request.
let cachedAgencyDb: string | null | undefined = undefined

export async function getAgencyDb(): Promise<string | null> {
  if (cachedAgencyDb !== undefined) return cachedAgencyDb
  try {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_NAME = 'v_6kMWFc_agcy_agency_members' LIMIT 1`
    )
    cachedAgencyDb = rows[0]?.TABLE_SCHEMA ?? null
  } catch {
    cachedAgencyDb = null
  }
  // After the assignment above cachedAgencyDb is always string | null —
  // narrow it for the function return type.
  return cachedAgencyDb as string | null
}

// Test-only escape hatch — clears the cache so unit / integration tests can
// re-stub the underlying query result. Not used in production code.
export function _resetAgencyDbCache() {
  cachedAgencyDb = undefined
}
