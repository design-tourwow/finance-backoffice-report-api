import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'

// MySQL Database connection pool configuration
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
