import mysql from 'mysql2/promise'

// Database connection pool configuration
const pool = mysql.createPool({
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

// Test connection on initialization
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully')
    connection.release()
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message)
  })

export default pool
