// Simple API logger
export function logApiRequest(
  method: string,
  path: string,
  status: number,
  apiKey?: string,
  error?: string
) {
  const timestamp = new Date().toISOString()
  const maskedKey = apiKey ? `${apiKey.substring(0, 10)}...` : 'none'
  
  const logEntry = {
    timestamp,
    method,
    path,
    status,
    apiKey: maskedKey,
    error: error || null
  }

  // Log to console (in production, send to logging service like Sentry, LogRocket, etc.)
  if (status >= 400) {
    console.error('[API ERROR]', JSON.stringify(logEntry))
  } else {
    console.log('[API REQUEST]', JSON.stringify(logEntry))
  }

  return logEntry
}

// Rate limiting helper (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  if (!record || now > record.resetTime) {
    // New window
    const resetTime = now + windowMs
    requestCounts.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  // Increment count
  record.count++
  requestCounts.set(identifier, record)
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 60000) // Clean up every minute
