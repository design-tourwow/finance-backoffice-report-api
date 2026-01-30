import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

// Database names
export const DB_NAMES = {
  TOURWOW: process.env.DB_NAME || 'tw_tourwow_db_views',
  LOCATIONS: process.env.DB_NAME_LOCATIONS || 'tw_locations_db_views',
  SUPPLIERS: process.env.DB_NAME_SUPPLIERS || 'tw_suppliers_db_views'
}

// View prefixes for each database
export const VIEW_PREFIXES = {
  TOURWOW: 'v_Xqc7k7_',
  LOCATIONS: 'v_Hdz2WSB_',
  SUPPLIERS: 'v_GsF2WeS_'
}

// MySQL Database connection pool configuration (connects without specific database)
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: false
  }
})

// Helper function to query specific database with full table name
export async function queryDatabase(database: string, sql: string, params?: any[]) {
  const connection = await mysqlPool.getConnection()
  try {
    const [rows] = await connection.query(sql, params)
    return rows
  } finally {
    connection.release()
  }
}

// Helper to get full table name with database prefix
export function getFullTableName(database: keyof typeof DB_NAMES, viewName: string) {
  const dbName = DB_NAMES[database]
  const prefix = VIEW_PREFIXES[database]
  return `${dbName}.${prefix}${viewName}`
}

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL || ''
// Use service_role key for backend (bypasses RLS), fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public'
      }
    })
  : null

// Client for user-authenticated requests (uses anon key + user JWT)
export const supabaseClient = supabaseUrl && process.env.SUPABASE_ANON_KEY
  ? createClient(
      supabaseUrl, 
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public'
        }
      }
    )
  : null

// Test MySQL connection on initialization
mysqlPool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database connected successfully')
    connection.release()
  })
  .catch(err => {
    console.error('❌ MySQL Database connection failed:', err.message)
  })

// Test Supabase connection on initialization
if (supabase && supabaseUrl && supabaseKey) {
  (async () => {
    try {
      await supabase.from('_health_check').select('count').limit(1)
      console.log('✅ Supabase connected successfully')
    } catch (err: any) {
      console.log('⚠️ Supabase connection check skipped (table may not exist yet):', err.message)
    }
  })()
}

export default mysqlPool
export { mysqlPool }
