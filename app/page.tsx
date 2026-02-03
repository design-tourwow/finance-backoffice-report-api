'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Helper Components
function EndpointListItem({ endpoint, isSelected, onClick, searchQuery }: any) {
  const methodColors: any = {
    GET: { bg: '#dbeafe', text: '#1e40af' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' },
    INFO: { bg: '#f3e8ff', text: '#6b21a8' }
  }

  const color = methodColors[endpoint.method] || methodColors.GET

  // Highlight search term
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} style={{ background: '#fef08a', color: '#854d0e', padding: 0, borderRadius: '2px' }}>{part}</mark>
        : part
    )
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 0.5rem',
        background: isSelected ? '#f3f4f6' : 'transparent',
        border: 'none',
        borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        width: '100%'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = '#f9fafb'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{
        background: color.bg,
        color: color.text,
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontWeight: '700',
        fontSize: '0.75rem',
        letterSpacing: '0.3px',
        minWidth: '3.5rem',
        textAlign: 'center'
      }}>
        {highlightText(endpoint.method, searchQuery)}
      </span>
      <code style={{
        fontSize: '0.8125rem',
        fontWeight: isSelected ? '600' : '500',
        color: isSelected ? '#111827' : '#4b5563',
        fontFamily: 'Monaco, Consolas, monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {highlightText(endpoint.path, searchQuery)}
      </code>
    </button>
  )
}

function EndpointDetail({ endpoint }: any) {
  const [copied, setCopied] = useState(false)
  const [copiedWithKey, setCopiedWithKey] = useState(false)
  const [showErrorExamples, setShowErrorExamples] = useState(false)

  const methodColors: any = {
    GET: { bg: '#dbeafe', text: '#1e40af' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' },
    INFO: { bg: '#f3e8ff', text: '#6b21a8' }
  }

  const color = methodColors[endpoint.method] || methodColors.GET

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyWithApiKey = () => {
    // Copy curl command as-is (with YOUR_API_KEY placeholder)
    navigator.clipboard.writeText(endpoint.curl)
    setCopiedWithKey(true)
    setTimeout(() => setCopiedWithKey(false), 2000)
  }

  // Generate error examples
  const errorExamples: any = {
    400: `{
  "success": false,
  "error": "Missing required fields"
}`,
    401: `{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}`,
    404: `{
  "success": false,
  "error": "User not found"
}`,
    409: `{
  "success": false,
  "error": "User with this user_id already exists"
}`,
    429: `{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "retryAfter": 45
}`,
    500: `{
  "success": false,
  "error": "Database query failed",
  "message": "Connection timeout"
}`,
    503: `{
  "success": false,
  "error": "Supabase not configured"
}`
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
      padding: '2rem',
      minHeight: '100%',
      alignItems: 'start'
    }}>
      {/* Left - Documentation */}
      <div style={{
        minWidth: 0,
        width: '100%'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{
              background: color.bg,
              color: color.text,
              padding: '0.375rem 0.875rem',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.875rem',
              letterSpacing: '0.5px'
            }}>
              {endpoint.method}
            </span>
            <code style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {endpoint.path}
            </code>
          </div>
          {endpoint.requiresAuth && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              color: '#6b7280',
              background: '#ffffff',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Requires API Key
            </div>
          )}
        </div>

        <p style={{
          margin: '0 0 2rem 0',
          fontSize: '1rem',
          color: '#4b5563',
          lineHeight: '1.6'
        }}>
          {endpoint.description}
        </p>

        {/* Parameters */}
        {endpoint.parameters && endpoint.parameters.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Query Parameters
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {endpoint.parameters.map((param: any, idx: number) => (
                <div key={idx} style={{
                  padding: '1rem',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <code style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}>
                      {param.name}
                    </code>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      background: '#f9fafb',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {param.type}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {param.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Body */}
        {endpoint.requestBody && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Request Body
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(endpoint.requestBody).map(([key, value]: any, idx: number) => (
                <div key={idx} style={{
                  padding: '1rem',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <code style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}>
                      {key}
                    </code>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      background: '#f9fafb',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {value.type}
                    </span>
                    {value.required && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#dc2626',
                        fontWeight: '600'
                      }}>
                        required
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responses */}
        <div>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Responses
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {endpoint.responses.map((resp: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: resp.status < 300 ? '#059669' : resp.status < 400 ? '#d97706' : '#dc2626',
                  fontFamily: 'Monaco, Consolas, monospace',
                  minWidth: '3rem'
                }}>
                  {resp.status}
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}>
                  {resp.description}
                </span>
              </div>
            ))}
          </div>
          
          {/* Error Examples Toggle */}
          {endpoint.responses.some((r: any) => r.status >= 400) && (
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => setShowErrorExamples(!showErrorExamples)}
                style={{
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  width: '100%',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                  transform: showErrorExamples ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                {showErrorExamples ? 'Hide' : 'Show'} Error Examples
              </button>
              
              {showErrorExamples && (
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {endpoint.responses
                    .filter((r: any) => r.status >= 400)
                    .map((resp: any, idx: number) => (
                      <div key={idx} style={{
                        background: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          background: '#111827',
                          borderBottom: '1px solid #374151',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          color: resp.status < 500 ? '#fbbf24' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          {resp.status} - {resp.description}
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '0.75rem',
                          fontSize: '0.8125rem',
                          lineHeight: '1.5',
                          fontFamily: 'Monaco, Consolas, monospace',
                          color: '#e5e7eb',
                          overflow: 'auto'
                        }}>
                          {errorExamples[resp.status] || `{
  "success": false,
  "error": "Error message"
}`}
                        </pre>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right - Code Examples */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        minWidth: 0,
        width: '100%'
      }}>
        {/* API Key Info */}
        <div style={{
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#111827',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Authentication
            </span>
          </div>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#1f2937'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginBottom: '0.5rem'
            }}>
              Use your API key from Vercel environment variables:
            </div>
            <code style={{
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '0.8125rem',
              color: '#fbbf24',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Authorization: Bearer YOUR_API_KEY
            </code>
            <div style={{
              fontSize: '0.6875rem',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              API keys: API_KEY_PRODUCTION, API_KEY_STAGING
            </div>
          </div>
        </div>
        
        {/* Request */}
        <div style={{
          background: '#1f2937',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #374151',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#111827',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Request
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={copyWithApiKey}
                style={{
                  background: copiedWithKey ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: copiedWithKey ? '#10b981' : '#9ca3af',
                  border: 'none',
                  padding: '0.375rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  transition: 'all 0.2s'
                }}
                title={copiedWithKey ? 'Copied!' : 'Copy cURL command'}
              >
                {copiedWithKey ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                )}
              </button>
              <button
                onClick={() => copyToClipboard(endpoint.curl)}
                style={{
                  background: copied ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: copied ? '#10b981' : '#9ca3af',
                  border: 'none',
                  padding: '0.375rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  transition: 'all 0.2s'
                }}
                title={copied ? 'Copied!' : 'Copy'}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <pre style={{
            margin: 0,
            padding: '1rem',
            color: '#e5e7eb',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            fontFamily: 'Monaco, Consolas, monospace',
            overflow: 'auto',
            flex: 1,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}>
            {endpoint.curl}
          </pre>
        </div>

        {/* Response */}
        <div style={{
          background: '#1f2937',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #374151',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '500px'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#111827',
            borderBottom: '1px solid #374151',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Response Example
            </span>
          </div>
          <pre style={{
            margin: 0,
            padding: '1rem',
            color: '#e5e7eb',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            fontFamily: 'Monaco, Consolas, monospace',
            overflow: 'auto',
            flex: 1,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}>
            {endpoint.response}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState('GET-/api/health')
  const [apiUrl, setApiUrl] = useState('http://localhost:3000')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null)
  const [databaseTables, setDatabaseTables] = useState<any>(null)
  const [dbTablesLoading, setDbTablesLoading] = useState(true)

  // Fetch database tables for dynamic documentation
  useEffect(() => {
    const fetchDatabaseTables = async () => {
      try {
        const res = await fetch('/api/docs/tables')
        const data = await res.json()
        if (data.success) {
          setDatabaseTables(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch database tables:', error)
      } finally {
        setDbTablesLoading(false)
      }
    }
    fetchDatabaseTables()
  }, [])

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    // Set API URL on client side only to avoid hydration mismatch
    setApiUrl(window.location.origin)
  }, [])

  // Define all endpoints
  const endpoints = [
    {
      id: 'GET-/docs/date-formats',
      method: 'GET',
      path: '/docs/date-formats',
      description: 'Supported date formats - Use query parameter "date_format" in report API endpoints',
      category: 'API Reference',
      subCategory: 'date-formats',
      requiresAuth: false,
      parameters: [
        { name: 'date_format', type: 'string', description: 'Date format key (22 formats available). Used with /api/reports/by-travel-date and /api/reports/by-booking-date' }
      ],
      curl: `# Date Format Usage Examples

# 1. Default format (Thai full month + Buddhist Era full year)
curl "${apiUrl}/api/reports/by-travel-date" \\
  -H "Authorization: Bearer YOUR_API_KEY"
# Returns: "th_full_be_full" format

# 2. English short month + Christian Era short year (for charts)
curl "${apiUrl}/api/reports/by-travel-date?date_format=en_short_ad_short" \\
  -H "Authorization: Bearer YOUR_API_KEY"
# Returns: "Jan 25"

# 3. English full month + Buddhist Era full year
curl "${apiUrl}/api/reports/by-travel-date?date_format=en_full_be_full" \\
  -H "Authorization: Bearer YOUR_API_KEY"
# Returns: "January 2568"

# 4. Numeric MM/YYYY format (recommended for frontend)
curl "${apiUrl}/api/reports/by-travel-date?date_format=numeric_month_year_full" \\
  -H "Authorization: Bearer YOUR_API_KEY"
# Returns: "01/2568"

# 5. Numeric compact MM/YY format (for charts)
curl "${apiUrl}/api/reports/by-travel-date?date_format=numeric_short" \\
  -H "Authorization: Bearer YOUR_API_KEY"
# Returns: "01/68"`,
      response: `{
  "formats": {
    "thai_buddhist_era": {
      "th_full_be_full": {
        "example": "January 2568 (Thai)",
        "description": "Thai full month + Buddhist Era full year",
        "use_case": "Default - Table display",
        "is_default": true
      },
      "th_short_be_short": {
        "example": "Jan 68 (Thai)",
        "description": "Thai short month + Buddhist Era short year",
        "use_case": "Chart labels (compact)"
      },
      "th_full_be_short": {
        "example": "January 68 (Thai)",
        "description": "Thai full month + Buddhist Era short year",
        "use_case": "Readable + compact year"
      },
      "th_short_be_full": {
        "example": "Jan 2568 (Thai)",
        "description": "Thai short month + Buddhist Era full year",
        "use_case": "Compact month + full year"
      }
    },
    "thai_christian_era": {
      "th_full_ad_full": {
        "example": "January 2025 (Thai)",
        "description": "Thai full month + Christian Era full year",
        "use_case": "Thai text + Christian year"
      },
      "th_short_ad_short": {
        "example": "Jan 25 (Thai)",
        "description": "Thai short month + Christian Era short year",
        "use_case": "Compact + Christian year"
      },
      "th_full_ad_short": {
        "example": "January 25 (Thai)",
        "description": "Thai full month + Christian Era short year",
        "use_case": "Readable + compact CE year"
      },
      "th_short_ad_full": {
        "example": "Jan 2025 (Thai)",
        "description": "Thai short month + Christian Era full year",
        "use_case": "Compact month + full CE year"
      }
    },
    "english_buddhist_era": {
      "en_full_be_full": {
        "example": "January 2568",
        "description": "English full month + Buddhist Era full year",
        "use_case": "International + Buddhist Era"
      },
      "en_short_be_short": {
        "example": "Jan 68",
        "description": "English short month + Buddhist Era short year",
        "use_case": "International chart + BE"
      },
      "en_full_be_short": {
        "example": "January 68",
        "description": "English full month + Buddhist Era short year",
        "use_case": "Readable English + compact BE"
      },
      "en_short_be_full": {
        "example": "Jan 2568",
        "description": "English short month + Buddhist Era full year",
        "use_case": "Compact English + full BE"
      }
    },
    "english_christian_era": {
      "en_full_ad_full": {
        "example": "January 2025",
        "description": "English full month + Christian Era full year",
        "use_case": "Standard international format"
      },
      "en_short_ad_short": {
        "example": "Jan 25",
        "description": "English short month + Christian Era short year",
        "use_case": "International chart"
      },
      "en_full_ad_short": {
        "example": "January 25",
        "description": "English full month + Christian Era short year",
        "use_case": "Readable + compact CE"
      },
      "en_short_ad_full": {
        "example": "Jan 2025",
        "description": "English short month + Christian Era full year",
        "use_case": "Compact + full CE year"
      }
    },
    "numeric_buddhist_era": {
      "numeric_short": {
        "example": "01/68",
        "description": "MM/YY Buddhist Era (2-digit year)",
        "use_case": "Most compact - Chart"
      },
      "numeric_month_year_full": {
        "example": "01/2568",
        "description": "MM/YYYY Buddhist Era (4-digit year)",
        "use_case": "Recommended for frontend - Clear and unambiguous"
      },
      "numeric_full": {
        "example": "14/01/2568",
        "description": "DD/MM/YYYY Buddhist Era",
        "use_case": "Full date - Lead Time Analysis"
      }
    },
    "numeric_christian_era": {
      "numeric_short_ad": {
        "example": "01/25",
        "description": "MM/YY Christian Era (2-digit year)",
        "use_case": "Compact international"
      },
      "numeric_month_year_full_ad": {
        "example": "01/2025",
        "description": "MM/YYYY Christian Era (4-digit year)",
        "use_case": "International standard"
      },
      "numeric_full_ad": {
        "example": "14/01/2025",
        "description": "DD/MM/YYYY Christian Era",
        "use_case": "Full date - Christian Era"
      }
    }
  },
  "supported_endpoints": [
    "/api/reports/by-travel-date",
    "/api/reports/by-booking-date",
    "/api/reports/lead-time-analysis"
  ],
  "recommendations": {
    "table_display": "th_full_be_full (default)",
    "chart_labels_compact": "numeric_short or en_short_ad_short",
    "chart_labels_clear": "numeric_month_year_full (recommended)",
    "international": "en_full_ad_full",
    "full_date": "numeric_full"
  },
  "notes": [
    "Default format is th_full_be_full if date_format is not specified",
    "Invalid format values fallback to th_full_be_full",
    "Only the 22 predefined formats are supported"
  ]
}`,
      responses: [
        { status: 200, description: 'Reference documentation - not an actual endpoint' }
      ]
    },
    {
      id: 'GET-/docs/time-periods',
      method: 'GET',
      path: '/docs/time-periods',
      description: 'Supported time periods/intervals - Use query parameter "period" in report API endpoints',
      category: 'API Reference',
      subCategory: 'time-periods',
      requiresAuth: false,
      parameters: [
        { name: 'period', type: 'string', description: 'Time period key (e.g., yearly, monthly, weekly, daily)' }
      ],
      curl: `# Time Period Usage Examples

# 1. Yearly aggregation
curl "\${apiUrl}/api/reports/summary?period=yearly" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. Quarterly aggregation
curl "\${apiUrl}/api/reports/summary?period=quarterly" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. Monthly aggregation (default)
curl "\${apiUrl}/api/reports/summary?period=monthly" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 4. Weekly aggregation
curl "\${apiUrl}/api/reports/summary?period=weekly" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 5. Daily aggregation
curl "\${apiUrl}/api/reports/summary?period=daily" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "periods": {
    "long_term": {
      "yearly": {
        "key": "yearly",
        "name": "Yearly / Annually",
        "description": "Every 1 year",
        "interval_months": 12,
        "use_case": "Annual reports, Year-over-year comparison"
      },
      "semi_annually": {
        "key": "semi_annually",
        "name": "Semi-annually",
        "description": "Every 6 months",
        "interval_months": 6,
        "use_case": "Half-year reports, Semi-annual reviews"
      },
      "quarterly": {
        "key": "quarterly",
        "name": "Quarterly",
        "description": "Every 3 months (Q1, Q2, Q3, Q4)",
        "interval_months": 3,
        "use_case": "Quarterly reports, Business performance"
      }
    },
    "monthly": {
      "monthly": {
        "key": "monthly",
        "name": "Monthly",
        "description": "Every 1 month",
        "interval_days": 30,
        "use_case": "Monthly reports, Standard billing cycle"
      },
      "semi_monthly": {
        "key": "semi_monthly",
        "name": "Semi-monthly",
        "description": "Twice per month (1st and 15th)",
        "interval_days": 15,
        "use_case": "Payroll (US), Bi-monthly payments"
      },
      "bi_monthly": {
        "key": "bi_monthly",
        "name": "Bi-monthly",
        "description": "Every 2 months",
        "interval_months": 2,
        "use_case": "Every two months",
        "note": "Ambiguous term - may be confused with semi_monthly. Recommend using every_two_months instead."
      }
    },
    "weekly": {
      "fortnightly": {
        "key": "fortnightly",
        "name": "Fortnightly",
        "description": "Every 2 weeks",
        "interval_days": 14,
        "use_case": "Payroll (UK/AU), Bi-weekly reports",
        "note": "Common in UK/Australia"
      },
      "bi_weekly": {
        "key": "bi_weekly",
        "name": "Bi-weekly",
        "description": "Every 2 weeks",
        "interval_days": 14,
        "use_case": "Payroll, Regular check-ins",
        "note": "Same as fortnightly - common in US"
      },
      "weekly": {
        "key": "weekly",
        "name": "Weekly",
        "description": "Every 1 week",
        "interval_days": 7,
        "use_case": "Weekly reports, Sprint cycles"
      }
    },
    "short_term": {
      "daily": {
        "key": "daily",
        "name": "Daily",
        "description": "Every 1 day",
        "interval_hours": 24,
        "use_case": "Daily reports, Dashboard updates"
      },
      "hourly": {
        "key": "hourly",
        "name": "Hourly",
        "description": "Every 1 hour",
        "interval_minutes": 60,
        "use_case": "Real-time monitoring, Hourly metrics"
      },
      "minutely": {
        "key": "minutely",
        "name": "Minutely",
        "description": "Every 1 minute",
        "interval_seconds": 60,
        "use_case": "High-frequency monitoring"
      },
      "secondly": {
        "key": "secondly",
        "name": "Secondly",
        "description": "Every 1 second",
        "interval_seconds": 1,
        "use_case": "Real-time data streams"
      }
    }
  },
  "supported_endpoints": [
    "/api/reports/summary",
    "/api/reports/by-travel-date",
    "/api/reports/by-booking-date"
  ],
  "recommendations": {
    "dashboard_overview": "monthly (default)",
    "trend_analysis": "weekly",
    "real_time_dashboard": "daily",
    "business_reports": "quarterly",
    "annual_review": "yearly"
  },
  "notes": [
    "Default period is 'monthly' if not specified",
    "bi_monthly and semi_monthly may be confused - verify use case",
    "fortnightly and bi_weekly have the same meaning (every 2 weeks)"
  ]
}`,
      responses: [
        { status: 200, description: 'Reference documentation - not an actual endpoint' }
      ]
    },
    {
      id: 'GET-/api/health',
      method: 'GET',
      path: '/api/health',
      description: 'Health check endpoint to monitor API status',
      category: 'System',
      subCategory: 'health',
      requiresAuth: false,
      curl: `curl ${apiUrl}/api/health`,
      response: `{
  "status": "ok",
  "timestamp": "2026-01-10T12:00:00Z",
  "service": "finance-backoffice-report-api"
}`,
      responses: [
        { status: 200, description: 'Successful response' }
      ]
    },
    {
      id: 'GET-/api/bookings',
      method: 'GET',
      path: '/api/bookings',
      description: 'Retrieve booking records from MySQL database',
      category: 'MySQL Database',
      subCategory: 'bookings',
      requiresAuth: true,
      parameters: [
        { name: 'limit', type: 'integer', description: 'Max records to return (default: 100)' },
        { name: 'type', type: 'string', description: 'Filter by booking type' }
      ],
      curl: `curl "${apiUrl}/api/bookings?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "ทัวร์ภูเก็ต 3 วัน 2 คืน",
      "type": "tour",
      "status": "confirmed",
      "created_at": "2026-01-05T10:30:00.000Z",
      "updated_at": "2026-01-05T10:30:00.000Z"
    },
    {
      "id": 2,
      "title": "จองโรงแรม กรุงเทพ",
      "type": "hotel",
      "status": "pending",
      "created_at": "2026-01-08T14:20:00.000Z",
      "updated_at": "2026-01-08T14:20:00.000Z"
    }
  ],
  "total": 2
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'POST-/api/bookings',
      method: 'POST',
      path: '/api/bookings',
      description: 'Create a new booking record',
      category: 'MySQL Database',
      subCategory: 'bookings',
      requiresAuth: true,
      requestBody: {
        title: { type: 'string', required: true, description: 'Booking title' },
        type: { type: 'string', required: true, description: 'Booking type (tour, hotel, flight, etc.)' }
      },
      curl: `curl -X POST "${apiUrl}/api/bookings" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "title": "ทัวร์เชียงใหม่ 4 วัน 3 คืน",
    "type": "tour"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 151,
    "title": "ทัวร์เชียงใหม่ 4 วัน 3 คืน",
    "type": "tour",
    "status": "pending",
    "created_at": "2026-01-10T16:45:00.000Z",
    "updated_at": "2026-01-10T16:45:00.000Z"
  }
}`,
      responses: [
        { status: 201, description: 'Created successfully' },
        { status: 400, description: 'Missing required fields (title or type)' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database insert failed' }
      ]
    },
    {
      id: 'GET-/api/users',
      method: 'GET',
      path: '/api/users',
      description: 'Retrieve user records from Supabase',
      category: 'Supabase',
      subCategory: 'users',
      requiresAuth: true,
      parameters: [
        { name: 'user_id', type: 'string', description: 'Filter by user ID' },
        { name: 'user_ns', type: 'string', description: 'Filter by namespace' },
        { name: 'name', type: 'string', description: 'Search by name' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' },
        { name: 'sort_by', type: 'string', description: 'Sort field (id, name, created_at, etc.)' },
        { name: 'sort_order', type: 'string', description: 'Sort direction (asc/desc)' }
      ],
      curl: `curl "${apiUrl}/api/users?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_ns": "line",
      "user_id": "U1234567890abcdef",
      "first_name": "Somchai",
      "last_name": "Jaidee",
      "name": "Somchai Jaidee",
      "profile_pic": "https://profile.line-scdn.net/0h1234abcdef",
      "subscribed": "2024-12-06T08:29:36+00:00",
      "last_interaction": "2024-12-06T08:31:02+00:00",
      "chat_history": [
        "You: สวัสดีครับ",
        "Bot: สวัสดีครับ ยินดีให้บริการ"
      ],
      "created_at": "2026-01-01T10:00:00+00:00",
      "updated_at": "2026-01-09T15:30:00+00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "returned": 1
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid parameters' },
        { status: 401, description: 'Invalid API key' },
        { status: 503, description: 'Supabase not configured' }
      ]
    },
    {
      id: 'POST-/api/users',
      method: 'POST',
      path: '/api/users',
      description: 'Create a new user. Only user_id is required.',
      category: 'Supabase',
      subCategory: 'users',
      requiresAuth: true,
      requestBody: {
        user_id: { type: 'string', required: true, description: 'Unique user identifier' },
        user_ns: { type: 'string', required: false, description: 'Namespace (e.g., "line")' },
        first_name: { type: 'string', required: false, description: 'First name' },
        last_name: { type: 'string', required: false, description: 'Last name' },
        name: { type: 'string', required: false, description: 'Full name' },
        profile_pic: { type: 'string', required: false, description: 'Profile picture URL' },
        subscribed: { type: 'timestamp', required: false, description: 'Subscription timestamp' },
        last_interaction: { type: 'timestamp', required: false, description: 'Last interaction' },
        chat_history: { type: 'array', required: false, description: 'Chat messages array' }
      },
      curl: `curl -X POST "${apiUrl}/api/users" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "user_ns": "line",
    "user_id": "U9876543210fedcba",
    "first_name": "Somying",
    "last_name": "Raksanuk",
    "name": "Somying Raksanuk",
    "profile_pic": "https://profile.line-scdn.net/0h9876fedcba",
    "subscribed": "2026-01-09T10:00:00+00:00",
    "last_interaction": "2026-01-09T10:00:00+00:00",
    "chat_history": ["You: สวัสดีค่ะ"]
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 2,
    "user_ns": "line",
    "user_id": "U9876543210fedcba",
    "first_name": "Somying",
    "last_name": "Raksanuk",
    "name": "Somying Raksanuk",
    "profile_pic": "https://profile.line-scdn.net/0h9876fedcba",
    "subscribed": "2026-01-09T10:00:00+00:00",
    "last_interaction": "2026-01-09T10:00:00+00:00",
    "chat_history": ["You: สวัสดีค่ะ"],
    "created_at": "2026-01-09T10:00:00+00:00",
    "updated_at": "2026-01-09T10:00:00+00:00"
  }
}`,
      responses: [
        { status: 201, description: 'User created' },
        { status: 400, description: 'Missing user_id or invalid format' },
        { status: 401, description: 'Invalid API key' },
        { status: 409, description: 'User already exists' }
      ]
    },
    {
      id: 'PUT-/api/users',
      method: 'PUT',
      path: '/api/users',
      description: 'Update user. Requires user_id, send only fields to update.',
      category: 'Supabase',
      subCategory: 'users',
      requiresAuth: true,
      requestBody: {
        user_id: { type: 'string', required: true, description: 'User ID to update' },
        first_name: { type: 'string', required: false, description: 'Updated first name' },
        last_name: { type: 'string', required: false, description: 'Updated last name' }
      },
      curl: `curl -X PUT "${apiUrl}/api/users" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "user_id": "U1234567890abcdef",
    "first_name": "Somchai Updated",
    "last_name": "Jaidee Updated"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "user_ns": "line",
    "user_id": "U1234567890abcdef",
    "first_name": "Somchai Updated",
    "last_name": "Jaidee Updated",
    "name": "Somchai Jaidee",
    "profile_pic": "https://profile.line-scdn.net/0h1234abcdef",
    "subscribed": "2024-12-06T08:29:36+00:00",
    "last_interaction": "2024-12-06T08:31:02+00:00",
    "chat_history": ["You: สวัสดีครับ"],
    "created_at": "2026-01-01T10:00:00+00:00",
    "updated_at": "2026-01-09T16:45:00+00:00"
  }
}`,
      responses: [
        { status: 200, description: 'Updated successfully' },
        { status: 400, description: 'Missing user_id' },
        { status: 404, description: 'User not found' }
      ]
    },
    {
      id: 'GET-/api/chat-history',
      method: 'GET',
      path: '/api/chat-history',
      description: 'Get chat_history for a user',
      category: 'Supabase',
      subCategory: 'chat',
      requiresAuth: true,
      parameters: [
        { name: 'user_id', type: 'string', description: 'User ID (required)' }
      ],
      curl: `curl "${apiUrl}/api/chat-history?user_id=U1234567890abcdef" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "user_id": "U1234567890abcdef",
  "name": "Somchai Jaidee",
  "chat_history": [
    "You: สวัสดีครับ",
    "Bot: สวัสดีครับ ยินดีให้บริการ",
    "You: ต้องการจองทัวร์"
  ],
  "total": 3
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Missing user_id' }
      ]
    },
    {
      id: 'POST-/api/chat-history',
      method: 'POST',
      path: '/api/chat-history',
      description: 'Add message to chat_history',
      category: 'Supabase',
      subCategory: 'chat',
      requiresAuth: true,
      requestBody: {
        user_id: { type: 'string', required: true, description: 'User ID' },
        message: { type: 'string', required: true, description: 'Chat message' }
      },
      curl: `curl -X POST "${apiUrl}/api/chat-history" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "user_id": "U1234567890abcdef",
    "message": "You: ต้องการจองทัวร์"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "user_ns": "line",
    "user_id": "U1234567890abcdef",
    "first_name": "Somchai",
    "last_name": "Jaidee",
    "name": "Somchai Jaidee",
    "profile_pic": "https://profile.line-scdn.net/0h1234abcdef",
    "subscribed": "2024-12-06T08:29:36+00:00",
    "last_interaction": "2026-01-10T14:20:00+00:00",
    "chat_history": [
      "You: สวัสดีครับ",
      "Bot: สวัสดีครับ ยินดีให้บริการ",
      "You: ต้องการจองทัวร์"
    ],
    "created_at": "2026-01-01T10:00:00+00:00",
    "updated_at": "2026-01-10T14:20:00+00:00"
  }
}`,
      responses: [
        { status: 201, description: 'Message added' },
        { status: 400, description: 'Missing required fields' }
      ]
    },
    {
      id: 'GET-/api/customers',
      method: 'GET',
      path: '/api/customers',
      description: 'Retrieve customer records from MySQL database (Xqc7k7_customers table)',
      category: 'MySQL Database',
      subCategory: 'customers',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Filter by customer ID' },
        { name: 'customer_code', type: 'string', description: 'Filter by customer code' },
        { name: 'name', type: 'string', description: 'Search by customer name (partial match)' },
        { name: 'phone_number', type: 'string', description: 'Filter by phone number' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/customers?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 152,
      "team_number": 3,
      "seller_agency_member_id": 629,
      "crm_agency_member_id": 623,
      "customer_code_prefix": "CUS2512",
      "customer_code_number": 1,
      "customer_code": "CUS251200001",
      "name": "จอง Item จากทัวร์ว้าว",
      "birth_date": null,
      "phone_number": "0292293211",
      "address": null,
      "email": "",
      "facebook_name": "",
      "facebook_url": null,
      "line_name": "",
      "line_url": null,
      "instagram": null,
      "remark": "",
      "first_paid_status_customer_order_installment_count": 1,
      "last_touchpoint_updated_at": null,
      "created_at": "2025-12-16T22:26:27.000Z",
      "created_by_agency_member_id": null,
      "updated_at": "2025-12-16T22:26:27.000Z",
      "updated_by_agency_member_id": null
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "returned": 1
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid parameters (limit exceeds 1000)' },
        { status: 401, description: 'Invalid API key' },
        { status: 429, description: 'Rate limit exceeded' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'POST-/api/customers',
      method: 'POST',
      path: '/api/customers',
      description: 'Create a new customer record',
      category: 'MySQL Database',
      subCategory: 'customers',
      requiresAuth: true,
      requestBody: {
        customer_code_prefix: { type: 'string', required: true, description: 'Customer code prefix (e.g., "CUS2601")' },
        customer_code_number: { type: 'integer', required: true, description: 'Customer code number' },
        customer_code: { type: 'string', required: true, description: 'Full customer code (e.g., "CUS260100001")' },
        name: { type: 'string', required: true, description: 'Customer name' },
        phone_number: { type: 'string', required: true, description: 'Phone number' },
        email: { type: 'string', required: false, description: 'Email address' },
        address: { type: 'string', required: false, description: 'Address' },
        birth_date: { type: 'date', required: false, description: 'Birth date (YYYY-MM-DD)' },
        facebook_name: { type: 'string', required: false, description: 'Facebook name' },
        line_name: { type: 'string', required: false, description: 'LINE name' },
        remark: { type: 'string', required: false, description: 'Additional notes' }
      },
      curl: `curl -X POST "${apiUrl}/api/customers" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "customer_code_prefix": "CUS2601",
    "customer_code_number": 1,
    "customer_code": "CUS260100001",
    "name": "สมชาย ใจดี",
    "phone_number": "0812345678",
    "email": "somchai@example.com"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 153,
    "customer_code_prefix": "CUS2601",
    "customer_code_number": 1,
    "customer_code": "CUS260100001",
    "name": "สมชาย ใจดี",
    "phone_number": "0812345678",
    "email": "somchai@example.com"
  }
}`,
      responses: [
        { status: 201, description: 'Customer created successfully' },
        { status: 400, description: 'Missing required fields' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database insert failed' }
      ]
    },
    {
      id: 'PUT-/api/customers',
      method: 'PUT',
      path: '/api/customers',
      description: 'Update an existing customer. Requires id, send only fields to update.',
      category: 'MySQL Database',
      subCategory: 'customers',
      requiresAuth: true,
      requestBody: {
        id: { type: 'integer', required: true, description: 'Customer ID to update' },
        name: { type: 'string', required: false, description: 'Updated name' },
        phone_number: { type: 'string', required: false, description: 'Updated phone' },
        email: { type: 'string', required: false, description: 'Updated email' },
        address: { type: 'string', required: false, description: 'Updated address' }
      },
      curl: `curl -X PUT "${apiUrl}/api/customers" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "id": 152,
    "name": "สมชาย ใจดีมาก",
    "email": "somchai.new@example.com"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 152,
    "name": "สมชาย ใจดีมาก",
    "email": "somchai.new@example.com"
  }
}`,
      responses: [
        { status: 200, description: 'Updated successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Customer not found' },
        { status: 500, description: 'Database update failed' }
      ]
    },
    {
      id: 'DELETE-/api/customers',
      method: 'DELETE',
      path: '/api/customers',
      description: 'Delete a customer by ID',
      category: 'MySQL Database',
      subCategory: 'customers',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Customer ID (required)' }
      ],
      curl: `curl -X DELETE "${apiUrl}/api/customers?id=152" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "message": "Customer deleted successfully"
}`,
      responses: [
        { status: 200, description: 'Deleted successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Customer not found' }
      ]
    },
    {
      id: 'GET-/api/orders',
      method: 'GET',
      path: '/api/orders',
      description: 'Retrieve order records from MySQL database (Xqc7k7_orders table). Excludes soft-deleted orders.',
      category: 'MySQL Database',
      subCategory: 'orders',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Filter by order ID' },
        { name: 'order_code', type: 'string', description: 'Filter by order code' },
        { name: 'customer_id', type: 'integer', description: 'Filter by customer ID' },
        { name: 'order_status', type: 'string', description: 'Filter by order status' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/orders?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1262,
      "booking_id": null,
      "agcy_agency_id": 1,
      "customer_id": 152,
      "parent_order_id": null,
      "team_number": 3,
      "seller_agency_member_id": 629,
      "crm_agency_member_id": 623,
      "is_old_customer": 0,
      "order_code_prefix": "TWP2601",
      "order_code_number": 1,
      "order_code": "TWP26010001",
      "order_status": "pending",
      "order_key": "ABC1234",
      "order_temp_key": "TMP1234",
      "order_passport_key": "PP12345678",
      "order_visa_key": "VS12345678",
      "product_owner_supplier_id": 1,
      "product_id": 100,
      "product_period_id": 50,
      "product_snapshot": {"name": "ทัวร์ญี่ปุ่น 5 วัน 4 คืน", "price": 50000},
      "product_period_snapshot": {"start_date": "2026-03-01", "end_date": "2026-03-05"},
      "product_pool_snapshot": null,
      "amount": "50000.00000",
      "discount": "5000.00000",
      "amount_with_discount": "45000.00000",
      "use_vat": 1,
      "use_visa": 0,
      "vat_percentage": "7.00000",
      "vat": "3150.00000",
      "net_amount": "48150.00000",
      "commission_company": "5000.00000",
      "commission_seller": "2000.00000",
      "extra_commission": null,
      "extra_discount": null,
      "extra_commission_per_unit": null,
      "extra_commission_unit": null,
      "extra_discount_per_unit": null,
      "extra_discount_unit": null,
      "supplier_income": null,
      "supplier_commission_vat_percentage": null,
      "supplier_commission_vat": null,
      "supplier_commission": null,
      "supplier_commission_with_vat": null,
      "supplier_commission_with_income": null,
      "supplier_commission_with_income_with_vat": null,
      "supplier_commission_with_income_vat": null,
      "supplier_use_withholding_tax": 0,
      "supplier_withholding_tax_percentage": null,
      "supplier_withholding_tax": null,
      "sum_supplier_order_installment_amount": "40000.00000",
      "sum_customer_order_installment_amount": "48150.00000",
      "customer_name": "จอง Item จากทัวร์ว้าว",
      "customer_phone_number": "0292293211",
      "customer_email": "",
      "customer_facebook": "",
      "customer_line": "",
      "customer_instagram": "",
      "customer_remark": "",
      "review_star": null,
      "review_note": null,
      "note": null,
      "visa_note": null,
      "passport_downloaded_count": 0,
      "visa_downloaded_count": 0,
      "first_seller_agency_member_id": null,
      "created_at": "2026-01-13T10:00:00.000Z",
      "created_by_agency_member_id": 629,
      "updated_at": "2026-01-13T10:00:00.000Z",
      "updated_by_agency_member_id": 629,
      "passport_approved_at": null,
      "passport_expired_at": null,
      "passport_approved_by_agency_member_id": null,
      "visa_approved_at": null,
      "visa_expired_at": null,
      "visa_approved_by_agency_member_id": null,
      "sent_file_to_supplier_at": null,
      "sent_file_to_supplier_by_agency_member_id": null,
      "approved_at": null,
      "approved_by_agency_member_id": null,
      "completed_at": null,
      "completed_by_agency_member_id": null,
      "completed_traveled_at": null,
      "completed_traveled_by_agency_member_id": null,
      "reviewed_at": null,
      "reviewed_by_agency_member_id": null,
      "waiting_canceled_at": null,
      "waiting_canceled_by_agency_member_id": null,
      "canceled_at": null,
      "canceled_by_agency_member_id": null,
      "deleted_at": null,
      "deleted_at_as_string": "",
      "deleted_by_agency_member_id": null
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "returned": 1
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid parameters' },
        { status: 401, description: 'Invalid API key' },
        { status: 429, description: 'Rate limit exceeded' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'POST-/api/orders',
      method: 'POST',
      path: '/api/orders',
      description: 'Create a new order record. Many fields are required for order creation.',
      category: 'MySQL Database',
      subCategory: 'orders',
      requiresAuth: true,
      requestBody: {
        agcy_agency_id: { type: 'integer', required: true, description: 'Agency ID' },
        order_code_prefix: { type: 'string', required: true, description: 'Order code prefix' },
        order_code_number: { type: 'integer', required: true, description: 'Order code number' },
        order_code: { type: 'string', required: true, description: 'Full order code' },
        order_status: { type: 'string', required: true, description: 'Order status (pending, approved, etc.)' },
        product_owner_supplier_id: { type: 'integer', required: true, description: 'Supplier ID' },
        product_id: { type: 'integer', required: true, description: 'Product ID' },
        product_snapshot: { type: 'json', required: true, description: 'Product details snapshot' },
        product_period_snapshot: { type: 'json', required: true, description: 'Period details snapshot' },
        amount: { type: 'decimal', required: true, description: 'Order amount' },
        amount_with_discount: { type: 'decimal', required: true, description: 'Amount after discount' },
        use_vat: { type: 'boolean', required: true, description: 'Whether VAT is applied' },
        vat_percentage: { type: 'decimal', required: true, description: 'VAT percentage' },
        vat: { type: 'decimal', required: true, description: 'VAT amount' },
        net_amount: { type: 'decimal', required: true, description: 'Net amount' },
        commission_company: { type: 'decimal', required: true, description: 'Company commission' },
        commission_seller: { type: 'decimal', required: true, description: 'Seller commission' },
        sum_supplier_order_installment_amount: { type: 'decimal', required: true, description: 'Total supplier installments' },
        sum_customer_order_installment_amount: { type: 'decimal', required: true, description: 'Total customer installments' },
        customer_name: { type: 'string', required: true, description: 'Customer name' },
        customer_phone_number: { type: 'string', required: true, description: 'Customer phone' }
      },
      curl: `curl -X POST "${apiUrl}/api/orders" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "agcy_agency_id": 1,
    "order_code_prefix": "TWP2601",
    "order_code_number": 2,
    "order_code": "TWP26010002",
    "order_status": "pending",
    "product_owner_supplier_id": 1,
    "product_id": 100,
    "product_snapshot": {"name": "ทัวร์ญี่ปุ่น 5 วัน 4 คืน"},
    "product_period_snapshot": {"start_date": "2026-03-01"},
    "amount": 50000.00,
    "amount_with_discount": 45000.00,
    "use_vat": true,
    "vat_percentage": 7.00,
    "vat": 3150.00,
    "net_amount": 48150.00,
    "commission_company": 5000.00,
    "commission_seller": 2000.00,
    "sum_supplier_order_installment_amount": 40000.00,
    "sum_customer_order_installment_amount": 48150.00,
    "customer_name": "สมชาย ใจดี",
    "customer_phone_number": "0812345678"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 1263,
    "order_code": "TWP26010002",
    "order_status": "pending",
    "customer_name": "สมชาย ใจดี",
    "net_amount": 48150.00
  }
}`,
      responses: [
        { status: 201, description: 'Order created successfully' },
        { status: 400, description: 'Missing required fields' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database insert failed' }
      ]
    },
    {
      id: 'PUT-/api/orders',
      method: 'PUT',
      path: '/api/orders',
      description: 'Update an existing order. Requires id, send only fields to update.',
      category: 'MySQL Database',
      subCategory: 'orders',
      requiresAuth: true,
      requestBody: {
        id: { type: 'integer', required: true, description: 'Order ID to update' },
        order_status: { type: 'string', required: false, description: 'Updated status' },
        note: { type: 'string', required: false, description: 'Updated note' },
        review_star: { type: 'integer', required: false, description: 'Review rating (1-5)' }
      },
      curl: `curl -X PUT "${apiUrl}/api/orders" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "id": 1262,
    "order_status": "approved",
    "note": "Customer confirmed payment"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 1262,
    "order_status": "approved",
    "note": "Customer confirmed payment"
  }
}`,
      responses: [
        { status: 200, description: 'Updated successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Order not found' },
        { status: 500, description: 'Database update failed' }
      ]
    },
    {
      id: 'DELETE-/api/orders',
      method: 'DELETE',
      path: '/api/orders',
      description: 'Soft delete an order by ID (sets deleted_at timestamp)',
      category: 'MySQL Database',
      subCategory: 'orders',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Order ID (required)' }
      ],
      curl: `curl -X DELETE "${apiUrl}/api/orders?id=1262" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "message": "Order deleted successfully"
}`,
      responses: [
        { status: 200, description: 'Deleted successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Order not found' }
      ]
    },
    {
      id: 'GET-/api/order-items',
      method: 'GET',
      path: '/api/order-items',
      description: 'ดึงข้อมูล order_items จาก Xqc7k7_order_items table',
      category: 'MySQL Database',
      subCategory: 'order-items',
      requiresAuth: true,
      parameters: [
        { name: 'order_id', type: 'integer', description: 'Filter by order ID' },
        { name: 'product_room_type_id_not_null', type: 'boolean', description: 'Filter only rows where product_room_type_id IS NOT NULL (true/false)' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `# ดึงข้อมูลทั้งหมด
curl "${apiUrl}/api/order-items?limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# ดึงตาม order_id
curl "${apiUrl}/api/order-items?order_id=1262" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# ดึงเฉพาะที่มี product_room_type_id (สำหรับนับจำนวนผู้เดินทาง)
curl "${apiUrl}/api/order-items?order_id=1262&product_room_type_id_not_null=true" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 5001,
      "order_id": 1262,
      "product_room_type_id": 15,
      "quantity": 2,
      "price": "25000.00",
      "created_at": "2026-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 100,
    "offset": 0,
    "returned": 3,
    "has_more": false
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Unauthorized' },
        { status: 500, description: 'Database error' }
      ]
    },
    {
      id: 'GET-/api/installments',
      method: 'GET',
      path: '/api/installments',
      description: 'Retrieve customer order installment records from MySQL database (Xqc7k7_customer_order_installments table)',
      category: 'MySQL Database',
      subCategory: 'installments',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Filter by installment ID' },
        { name: 'order_id', type: 'integer', description: 'Filter by order ID' },
        { name: 'status', type: 'string', description: 'Filter by status (pending, paid, etc.)' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/installments?order_id=1262" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1821,
      "order_id": 1262,
      "ordinal": 3,
      "status": "pending",
      "due_date": "2026-03-13T17:00:00.000Z",
      "amount": "76.00000",
      "payment_is_in_progress": 0,
      "customer_order_installment_snapshot": null
    },
    {
      "id": 1820,
      "order_id": 1262,
      "ordinal": 2,
      "status": "pending",
      "due_date": "2026-02-13T17:00:00.000Z",
      "amount": "700.00000",
      "payment_is_in_progress": 0,
      "customer_order_installment_snapshot": null
    },
    {
      "id": 1819,
      "order_id": 1262,
      "ordinal": 1,
      "status": "paid",
      "due_date": "2026-01-13T17:00:00.000Z",
      "amount": "77000.00000",
      "payment_is_in_progress": 0,
      "customer_order_installment_snapshot": {"payment_method": "bank_transfer", "paid_at": "2026-01-13T10:00:00Z"}
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "returned": 3
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid parameters' },
        { status: 401, description: 'Invalid API key' },
        { status: 429, description: 'Rate limit exceeded' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'POST-/api/installments',
      method: 'POST',
      path: '/api/installments',
      description: 'Create a new installment record for an order',
      category: 'MySQL Database',
      subCategory: 'installments',
      requiresAuth: true,
      requestBody: {
        order_id: { type: 'integer', required: true, description: 'Order ID' },
        ordinal: { type: 'integer', required: true, description: 'Installment sequence number (1, 2, 3, etc.)' },
        status: { type: 'string', required: true, description: 'Status (pending, paid, overdue, etc.)' },
        amount: { type: 'decimal', required: true, description: 'Installment amount' },
        due_date: { type: 'date', required: false, description: 'Due date (YYYY-MM-DD)' },
        payment_is_in_progress: { type: 'boolean', required: false, description: 'Payment in progress flag (default: false)' },
        customer_order_installment_snapshot: { type: 'json', required: false, description: 'Additional installment data' }
      },
      curl: `curl -X POST "${apiUrl}/api/installments" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "order_id": 1262,
    "ordinal": 4,
    "status": "pending",
    "due_date": "2026-04-13",
    "amount": 10000.00,
    "payment_is_in_progress": 0
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 1822,
    "order_id": 1262,
    "ordinal": 4,
    "status": "pending",
    "due_date": "2026-04-13",
    "amount": 10000.00,
    "payment_is_in_progress": 0
  }
}`,
      responses: [
        { status: 201, description: 'Installment created successfully' },
        { status: 400, description: 'Missing required fields' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database insert failed' }
      ]
    },
    {
      id: 'PUT-/api/installments',
      method: 'PUT',
      path: '/api/installments',
      description: 'Update an existing installment. Requires id, send only fields to update.',
      category: 'MySQL Database',
      subCategory: 'installments',
      requiresAuth: true,
      requestBody: {
        id: { type: 'integer', required: true, description: 'Installment ID to update' },
        status: { type: 'string', required: false, description: 'Updated status' },
        payment_is_in_progress: { type: 'boolean', required: false, description: 'Payment progress flag' },
        customer_order_installment_snapshot: { type: 'json', required: false, description: 'Updated snapshot data' }
      },
      curl: `curl -X PUT "${apiUrl}/api/installments" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "id": 1819,
    "status": "paid",
    "customer_order_installment_snapshot": {
      "payment_method": "bank_transfer",
      "paid_at": "2026-01-13T10:00:00Z"
    }
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 1819,
    "status": "paid",
    "customer_order_installment_snapshot": {
      "payment_method": "bank_transfer",
      "paid_at": "2026-01-13T10:00:00Z"
    }
  }
}`,
      responses: [
        { status: 200, description: 'Updated successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Installment not found' },
        { status: 500, description: 'Database update failed' }
      ]
    },
    {
      id: 'DELETE-/api/installments',
      method: 'DELETE',
      path: '/api/installments',
      description: 'Delete an installment by ID',
      category: 'MySQL Database',
      subCategory: 'installments',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Installment ID (required)' }
      ],
      curl: `curl -X DELETE "${apiUrl}/api/installments?id=1822" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "message": "Installment deleted successfully"
}`,
      responses: [
        { status: 200, description: 'Deleted successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Installment not found' }
      ]
    },
    {
      id: 'GET-/api/database/tables',
      method: 'GET',
      path: '/api/database/tables',
      description: 'List all tables from all databases (TOURWOW, LOCATIONS, SUPPLIERS)',
      category: 'MySQL Database',
      subCategory: 'database',
      requiresAuth: true,
      parameters: [
        { name: 'database', type: 'string', description: 'Filter by database (TOURWOW, LOCATIONS, SUPPLIERS)' },
        { name: 'include_columns', type: 'boolean', description: 'Include column details (true/false)' }
      ],
      curl: `curl "${apiUrl}/api/database/tables?database=TOURWOW" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "databases": [
      {
        "database": "tw_tourwow_db_views",
        "prefix": "Xqc7k7_",
        "tables": [
          { "table_name": "Xqc7k7_orders", "table_type": "BASE TABLE", "table_rows": 5000 },
          { "table_name": "Xqc7k7_order_items", "table_type": "BASE TABLE", "table_rows": 15000 },
          { "table_name": "Xqc7k7_customers", "table_type": "BASE TABLE", "table_rows": 3000 }
        ],
        "table_count": 12
      }
    ],
    "summary": { "total_databases": 3, "total_tables": 20 }
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Unauthorized' },
        { status: 500, description: 'Database error' }
      ]
    },
    {
      id: 'GET-/api/database/schema',
      method: 'GET',
      path: '/api/database/schema',
      description: 'Get complete schema of all databases, tables, and columns',
      category: 'MySQL Database',
      subCategory: 'database',
      requiresAuth: true,
      parameters: [
        { name: 'database', type: 'string', description: 'Filter by database (TOURWOW, LOCATIONS, SUPPLIERS)' },
        { name: 'table', type: 'string', description: 'Filter by table name (partial match)' }
      ],
      curl: `curl "${apiUrl}/api/database/schema?database=TOURWOW&table=order_items" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "databases": [
      {
        "database": "tw_tourwow_db_views",
        "tables": [
          {
            "table_name": "Xqc7k7_order_items",
            "columns": [
              { "column_name": "id", "data_type": "int", "is_nullable": false, "column_key": "PRI" },
              { "column_name": "order_id", "data_type": "int", "is_nullable": false, "column_key": "MUL" },
              { "column_name": "product_room_type_id", "data_type": "int", "is_nullable": true },
              { "column_name": "quantity", "data_type": "int", "is_nullable": false },
              { "column_name": "price", "data_type": "decimal", "is_nullable": true }
            ],
            "column_count": 10
          }
        ]
      }
    ],
    "summary": { "total_databases": 1, "total_tables": 1, "total_columns": 10 }
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Unauthorized' },
        { status: 500, description: 'Database error' }
      ]
    },
    {
      id: 'GET-/api/database/query',
      method: 'GET',
      path: '/api/database/query',
      description: 'Query any table from any database with filtering, sorting, and pagination',
      category: 'MySQL Database',
      subCategory: 'database',
      requiresAuth: true,
      parameters: [
        { name: 'database', type: 'string', description: 'Database key (TOURWOW, LOCATIONS, SUPPLIERS) - required' },
        { name: 'table', type: 'string', description: 'Table name (e.g., Xqc7k7_order_items) - required' },
        { name: 'columns', type: 'string', description: 'Comma-separated column names' },
        { name: 'where_column', type: 'string', description: 'Column for WHERE clause' },
        { name: 'where_value', type: 'string', description: 'Value for WHERE clause' },
        { name: 'where_operator', type: 'string', description: 'Operator (=, !=, >, <, >=, <=, LIKE)' },
        { name: 'order_by', type: 'string', description: 'Column for ORDER BY' },
        { name: 'order_dir', type: 'string', description: 'ASC or DESC' },
        { name: 'limit', type: 'integer', description: 'Max rows (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Offset for pagination' }
      ],
      curl: `curl "${apiUrl}/api/database/query?database=TOURWOW&table=Xqc7k7_order_items&where_column=order_id&where_value=1262&limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 5001,
      "order_id": 1262,
      "product_room_type_id": 15,
      "quantity": 2,
      "price": "25000.00"
    }
  ],
  "meta": {
    "database": "tw_tourwow_db_views",
    "table": "Xqc7k7_order_items"
  },
  "pagination": {
    "total": 3,
    "limit": 10,
    "offset": 0,
    "returned": 3,
    "has_more": false
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Missing required parameters' },
        { status: 401, description: 'Unauthorized' },
        { status: 404, description: 'Table not found' },
        { status: 500, description: 'Database error' }
      ]
    },
    {
      id: 'POST-/api/database/query',
      method: 'POST',
      path: '/api/database/query',
      description: 'Advanced query with multiple WHERE conditions',
      category: 'MySQL Database',
      subCategory: 'database',
      requiresAuth: true,
      requestBody: {
        database: { type: 'string', required: true, description: 'Database key (TOURWOW, LOCATIONS, SUPPLIERS)' },
        table: { type: 'string', required: true, description: 'Table name (e.g., Xqc7k7_order_items)' },
        columns: { type: 'array', required: false, description: 'Array of column names' },
        where: { type: 'array', required: false, description: 'Array of WHERE conditions [{column, operator, value}]' },
        order_by: { type: 'array', required: false, description: 'Array of ORDER BY [{column, direction}]' },
        limit: { type: 'integer', required: false, description: 'Max rows (default: 100)' },
        offset: { type: 'integer', required: false, description: 'Offset (default: 0)' }
      },
      curl: `curl -X POST "${apiUrl}/api/database/query" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "database": "TOURWOW",
    "table": "Xqc7k7_order_items",
    "columns": ["id", "order_id", "quantity", "price"],
    "where": [
      { "column": "product_room_type_id", "operator": "IS NOT NULL" },
      { "column": "quantity", "operator": ">=", "value": 1 }
    ],
    "order_by": [{ "column": "order_id", "direction": "DESC" }],
    "limit": 50
  }'`,
      response: `{
  "success": true,
  "data": [
    { "id": 5001, "order_id": 1262, "quantity": 2, "price": "25000.00" },
    { "id": 5002, "order_id": 1262, "quantity": 1, "price": "25000.00" }
  ],
  "pagination": { "total": 15000, "limit": 50, "offset": 0, "returned": 50, "has_more": true }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid request body' },
        { status: 401, description: 'Unauthorized' },
        { status: 404, description: 'Table not found' },
        { status: 500, description: 'Database error' }
      ]
    },
    // Dynamic Table Endpoints
    {
      id: 'GET-/api/tables',
      method: 'GET',
      path: '/api/tables',
      description: 'List all databases and their tables with direct access endpoints',
      category: 'MySQL Database',
      subCategory: 'tables-dynamic',
      requiresAuth: true,
      curl: `curl "${apiUrl}/api/tables" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "databases": [
      {
        "database_key": "tourwow",
        "database_name": "tw_tourwow_db_views",
        "description": "Orders, Customers, Bookings, Order Items, Installments",
        "endpoint": "/api/tables/tourwow",
        "tables": [
          { "table_name": "orders", "endpoint": "/api/tables/tourwow/orders", "table_rows": 5000 },
          { "table_name": "order_items", "endpoint": "/api/tables/tourwow/order_items", "table_rows": 15000 },
          { "table_name": "customers", "endpoint": "/api/tables/tourwow/customers", "table_rows": 3000 }
        ],
        "table_count": 12
      }
    ]
  },
  "usage": {
    "list_all": "/api/tables",
    "list_database": "/api/tables/{database}",
    "query_table": "/api/tables/{database}/{table}"
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Unauthorized' }
      ]
    },
    {
      id: 'GET-/api/tables/tourwow',
      method: 'GET',
      path: '/api/tables/{database}',
      description: 'List all tables in a specific database (tourwow, locations, suppliers)',
      category: 'MySQL Database',
      subCategory: 'tables-dynamic',
      requiresAuth: true,
      parameters: [
        { name: 'database', type: 'string', description: 'Database key: tourwow, locations, or suppliers' }
      ],
      curl: `curl "${apiUrl}/api/tables/tourwow" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": {
    "database": "tw_tourwow_db_views",
    "description": "Orders, Customers, Bookings, Order Items, Installments",
    "tables": [
      { "table_name": "orders", "endpoint": "/api/tables/tourwow/orders", "table_rows": 5000 },
      { "table_name": "order_items", "endpoint": "/api/tables/tourwow/order_items", "table_rows": 15000 },
      { "table_name": "customers", "endpoint": "/api/tables/tourwow/customers", "table_rows": 3000 }
    ],
    "table_count": 12
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid database key' },
        { status: 401, description: 'Unauthorized' }
      ]
    },
    {
      id: 'GET-/api/tables/tourwow/orders',
      method: 'GET',
      path: '/api/tables/{database}/{table}',
      description: 'Query any table directly by database and table name (LIVE data)',
      category: 'MySQL Database',
      subCategory: 'tables-dynamic',
      requiresAuth: true,
      parameters: [
        { name: 'database', type: 'string', description: 'Database key: tourwow, locations, suppliers' },
        { name: 'table', type: 'string', description: 'Table name without prefix (e.g., orders, order_items, customers)' },
        { name: 'columns', type: 'string', description: 'Comma-separated column names' },
        { name: 'where_column', type: 'string', description: 'Column for filtering' },
        { name: 'where_value', type: 'string', description: 'Value to filter by' },
        { name: 'where_operator', type: 'string', description: '=, !=, >, <, >=, <=, LIKE' },
        { name: 'order_by', type: 'string', description: 'Column to sort by' },
        { name: 'order_dir', type: 'string', description: 'ASC or DESC' },
        { name: 'limit', type: 'integer', description: 'Max rows (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Offset for pagination' }
      ],
      curl: `# Query orders table
curl "${apiUrl}/api/tables/tourwow/orders?limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Query order_items with filter
curl "${apiUrl}/api/tables/tourwow/order_items?where_column=order_id&where_value=1262&limit=50" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Query customers by name
curl "${apiUrl}/api/tables/tourwow/customers?where_column=name&where_value=john&where_operator=LIKE" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Query countries from locations database
curl "${apiUrl}/api/tables/locations/countries?order_by=name_th&limit=20" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 5001,
      "order_id": 1262,
      "product_room_type_id": 15,
      "quantity": 2,
      "price": "25000.00"
    }
  ],
  "meta": {
    "database": "tw_tourwow_db_views",
    "table": "Xqc7k7_order_items",
    "endpoint": "/api/tables/tourwow/order_items"
  },
  "pagination": {
    "total": 15000,
    "limit": 100,
    "offset": 0,
    "returned": 100,
    "has_more": true
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid database key' },
        { status: 401, description: 'Unauthorized' },
        { status: 404, description: 'Table not found' },
        { status: 500, description: 'Database error' }
      ]
    },
    {
      id: 'GET-/api/suppliers',
      method: 'GET',
      path: '/api/suppliers',
      description: 'Retrieve supplier records from MySQL database (tw_suppliers_db.GsF2WeS_suppliers table)',
      category: 'MySQL Database',
      subCategory: 'suppliers',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Filter by supplier ID' },
        { name: 'code', type: 'string', description: 'Filter by supplier code' },
        { name: 'name_en', type: 'string', description: 'Search by English name (partial match)' },
        { name: 'name_th', type: 'string', description: 'Search by Thai name (partial match)' },
        { name: 'status_code', type: 'integer', description: 'Filter by status code' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 100, max: 1000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/suppliers?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 75,
      "name_en": "Sabaidee Tour",
      "name_th": "สบายดรทัวร์",
      "product_twp_slug": "sabaidee-tour",
      "category_tourism_licenses_id": 1,
      "tourism_license": "11/12345",
      "tourism_license_expire_at": "2027-12-31T00:00:00.000Z",
      "company_type": 1,
      "company_license": "0105123456789",
      "company_name": "บริษัท สบายดรทัวร์ จำกัด",
      "individual_first_name": null,
      "individual_last_name": null,
      "individual_id_card": null,
      "fax_no": "021234567",
      "email": "contact@sabaideetour.com",
      "line_id": "@sabaideetour",
      "twitter": null,
      "youtube": "https://youtube.com/@sabaideetour",
      "instagram": "@sabaideetour",
      "website": "https://www.sabaideetour.com",
      "description": "ผู้ให้บริการทัวร์คุณภาพ",
      "note": "Trusted partner",
      "program_quantity": 50,
      "status_code": 1,
      "status_reason": null,
      "product_pool_ranking": 10,
      "created_by": "admin",
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_by": "admin",
      "updated_at": "2026-01-10T15:30:00.000Z",
      "validated_by": "admin",
      "validated_at": "2024-01-15T10:00:00.000Z",
      "code": "SUP001",
      "image_file_name": "sabaidee-logo.jpg",
      "image_file_size": 102400,
      "image_content_type": "image/jpeg",
      "image_updated_at": "2024-01-01T10:00:00.000Z",
      "company_license_document_file_name": "company-license.pdf",
      "company_license_document_file_size": 512000,
      "company_license_document_content_type": "application/pdf",
      "company_license_document_updated_at": "2024-01-01T10:00:00.000Z",
      "individual_id_card_document_file_name": null,
      "individual_id_card_document_file_size": null,
      "individual_id_card_document_content_type": null,
      "individual_id_card_document_updated_at": null,
      "facebook": "https://facebook.com/sabaideetour",
      "is_free_cancel": 1,
      "is_withholding_tax": 1,
      "tel": "021234567",
      "is_product_twp": 1,
      "is_product_tw": 0,
      "product_twp_invoice_approve_auto": 0,
      "product_twp_invoice_default_note": "ขอบคุณที่ใช้บริการ",
      "product_twp_invoice_installment_first": 50,
      "product_twp_invoice_installment_second": 50,
      "product_twp_period_display_commission": 1,
      "product_twp_invoice_themes_id": 1,
      "product_twp_invoice_email_sender_seller": 1,
      "is_channel_ob": 0
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "returned": 1
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 400, description: 'Invalid parameters' },
        { status: 401, description: 'Invalid API key' },
        { status: 429, description: 'Rate limit exceeded' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'POST-/api/suppliers',
      method: 'POST',
      path: '/api/suppliers',
      description: 'Create a new supplier record',
      category: 'MySQL Database',
      subCategory: 'suppliers',
      requiresAuth: true,
      requestBody: {
        name_en: { type: 'string', required: false, description: 'English name' },
        name_th: { type: 'string', required: false, description: 'Thai name' },
        code: { type: 'string', required: false, description: 'Supplier code (unique)' },
        email: { type: 'string', required: false, description: 'Email address' },
        tel: { type: 'string', required: false, description: 'Telephone number' },
        company_name: { type: 'string', required: false, description: 'Company name' },
        company_license: { type: 'string', required: false, description: 'Company license number' },
        tourism_license: { type: 'string', required: false, description: 'Tourism license number' },
        website: { type: 'string', required: false, description: 'Website URL' },
        status_code: { type: 'integer', required: false, description: 'Status code (default: 1)' }
      },
      curl: `curl -X POST "${apiUrl}/api/suppliers" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "name_en": "Amazing Tours",
    "name_th": "ทัวร์สุดยอด",
    "code": "SUP002",
    "email": "contact@amazingtours.com",
    "tel": "021234567",
    "status_code": 1
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 76,
    "name_en": "Amazing Tours",
    "name_th": "ทัวร์สุดยอด",
    "code": "SUP002",
    "email": "contact@amazingtours.com",
    "tel": "021234567",
    "status_code": 1
  }
}`,
      responses: [
        { status: 201, description: 'Supplier created successfully' },
        { status: 400, description: 'Invalid data' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database insert failed' }
      ]
    },
    {
      id: 'PUT-/api/suppliers',
      method: 'PUT',
      path: '/api/suppliers',
      description: 'Update an existing supplier. Requires id, send only fields to update.',
      category: 'MySQL Database',
      subCategory: 'suppliers',
      requiresAuth: true,
      requestBody: {
        id: { type: 'integer', required: true, description: 'Supplier ID to update' },
        name_en: { type: 'string', required: false, description: 'Updated English name' },
        name_th: { type: 'string', required: false, description: 'Updated Thai name' },
        email: { type: 'string', required: false, description: 'Updated email' },
        tel: { type: 'string', required: false, description: 'Updated telephone' },
        status_code: { type: 'integer', required: false, description: 'Updated status' }
      },
      curl: `curl -X PUT "${apiUrl}/api/suppliers" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "id": 75,
    "name_en": "Sabaidee Tour Updated",
    "email": "new@sabaideetour.com"
  }'`,
      response: `{
  "success": true,
  "data": {
    "id": 75,
    "name_en": "Sabaidee Tour Updated",
    "email": "new@sabaideetour.com"
  }
}`,
      responses: [
        { status: 200, description: 'Updated successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Supplier not found' },
        { status: 500, description: 'Database update failed' }
      ]
    },
    {
      id: 'DELETE-/api/suppliers',
      method: 'DELETE',
      path: '/api/suppliers',
      description: 'Delete a supplier by ID',
      category: 'MySQL Database',
      subCategory: 'suppliers',
      requiresAuth: true,
      parameters: [
        { name: 'id', type: 'integer', description: 'Supplier ID (required)' }
      ],
      curl: `curl -X DELETE "${apiUrl}/api/suppliers?id=76" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "message": "Supplier deleted successfully"
}`,
      responses: [
        { status: 200, description: 'Deleted successfully' },
        { status: 400, description: 'Missing id' },
        { status: 404, description: 'Supplier not found' }
      ]
    },
    {
      id: 'DELETE-/api/chat-history',
      method: 'DELETE',
      path: '/api/chat-history',
      description: 'Clear chat_history for a user',
      category: 'Supabase',
      subCategory: 'chat',
      requiresAuth: true,
      parameters: [
        { name: 'user_id', type: 'string', description: 'User ID (required)' }
      ],
      curl: `curl -X DELETE "${apiUrl}/api/chat-history?user_id=U1234567890abcdef" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "message": "Chat history cleared"
}`,
      responses: [
        { status: 200, description: 'Cleared successfully' },
        { status: 400, description: 'Missing user_id' }
      ]
    },
    {
      id: 'GET-/api/reports/lead-time-analysis',
      method: 'GET',
      path: '/api/reports/lead-time-analysis',
      description: 'Analyze booking lead time (days between booking date and travel date) with statistics and distribution',
      category: 'MySQL Database',
      subCategory: 'reports',
      requiresAuth: true,
      parameters: [
        { name: 'country_id', type: 'string', description: 'Single or comma-separated country IDs (e.g., "7" or "7,39,4")' },
        { name: 'supplier_id', type: 'string', description: 'Single or comma-separated supplier IDs (e.g., "1" or "1,5,10")' },
        { name: 'travel_date_from', type: 'date', description: 'Start travel date (YYYY-MM-DD)' },
        { name: 'travel_date_to', type: 'date', description: 'End travel date (YYYY-MM-DD)' },
        { name: 'booking_date_from', type: 'date', description: 'Start booking date (YYYY-MM-DD)' },
        { name: 'booking_date_to', type: 'date', description: 'End booking date (YYYY-MM-DD)' },
        { name: 'limit', type: 'integer', description: 'Max records (default: 1000, max: 10000)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/reports/lead-time-analysis?country_id=7,39&limit=100" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "order_id": 1262,
      "order_code": "TWP26010001",
      "customer_id": 152,
      "customer_name": "จอง Item จากทัวร์ว้าว",
      "customer_code": "CUS251200001",
      "country_id": 7,
      "country_name": "ญี่ปุ่น",
      "supplier_id": 1,
      "supplier_name": "Sabaidee Tour",
      "created_at": "13/01/2569",
      "travel_start_date": "01/03/2569",
      "travel_end_date": "05/03/2569",
      "lead_time_days": 47,
      "net_amount": 48150
    }
  ],
  "summary": {
    "total_orders": 877,
    "avg_lead_time": 45.3,
    "min_lead_time": 0,
    "max_lead_time": 365,
    "median_lead_time": 30,
    "total_net_amount": 90971192
  },
  "distribution": [
    {
      "range": "0-7",
      "range_label": "0-7 วัน (จองใกล้วันเดินทาง)",
      "min_days": 0,
      "max_days": 7,
      "count": 150,
      "percentage": 17.1,
      "total_net_amount": 15000000,
      "avg_net_amount": 100000
    },
    {
      "range": "8-14",
      "range_label": "8-14 วัน",
      "min_days": 8,
      "max_days": 14,
      "count": 180,
      "percentage": 20.5,
      "total_net_amount": 18000000,
      "avg_net_amount": 100000
    },
    {
      "range": "15-30",
      "range_label": "15-30 วัน",
      "min_days": 15,
      "max_days": 30,
      "count": 280,
      "percentage": 31.9,
      "total_net_amount": 28000000,
      "avg_net_amount": 100000
    },
    {
      "range": "31-60",
      "range_label": "31-60 วัน",
      "min_days": 31,
      "max_days": 60,
      "count": 150,
      "percentage": 17.1,
      "total_net_amount": 15000000,
      "avg_net_amount": 100000
    },
    {
      "range": "61-90",
      "range_label": "61-90 วัน",
      "min_days": 61,
      "max_days": 90,
      "count": 80,
      "percentage": 9.1,
      "total_net_amount": 8000000,
      "avg_net_amount": 100000
    },
    {
      "range": "90+",
      "range_label": "มากกว่า 90 วัน (จองล่วงหน้ามาก)",
      "min_days": 91,
      "max_days": null,
      "count": 37,
      "percentage": 4.2,
      "total_net_amount": 6971192,
      "avg_net_amount": 188410
    }
  ],
  "pagination": {
    "total": 877,
    "limit": 1000,
    "offset": 0,
    "has_more": false
  }
}`,
      responses: [
        { status: 200, description: 'Successful response with lead time analysis' },
        { status: 400, description: 'Invalid date format (use YYYY-MM-DD)' },
        { status: 401, description: 'Invalid API key' },
        { status: 429, description: 'Rate limit exceeded' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    // ==================== LOCATIONS DATABASE ====================
    {
      id: 'GET-/api/locations/continents',
      method: 'GET',
      path: '/api/locations/continents',
      description: 'ดึงรายการทวีปทั้งหมด (tw_locations_db_views)',
      category: 'MySQL Database',
      subCategory: 'locations',
      requiresAuth: true,
      parameters: [],
      curl: `curl "${apiUrl}/api/locations/continents" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_th": "เอเชีย",
      "name_en": "Asia",
      "code": "AS",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 7
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'GET-/api/locations/countries',
      method: 'GET',
      path: '/api/locations/countries',
      description: 'ดึงรายการประเทศทั้งหมด พร้อม filter และ pagination (tw_locations_db_views)',
      category: 'MySQL Database',
      subCategory: 'locations',
      requiresAuth: true,
      parameters: [
        { name: 'continent_id', type: 'integer', description: 'Filter by continent ID' },
        { name: 'search', type: 'string', description: 'Search by name_th, name_en, or code' },
        { name: 'limit', type: 'integer', description: 'Max records to return (default: 100)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/locations/countries?continent_id=1&limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 7,
      "name_th": "ญี่ปุ่น",
      "name_en": "Japan",
      "code": "JP",
      "continent_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'GET-/api/locations/regions',
      method: 'GET',
      path: '/api/locations/regions',
      description: 'ดึงรายการภูมิภาคตาม country (tw_locations_db_views)',
      category: 'MySQL Database',
      subCategory: 'locations',
      requiresAuth: true,
      parameters: [
        { name: 'country_id', type: 'integer', description: 'Filter by country ID' },
        { name: 'limit', type: 'integer', description: 'Max records to return (default: 100)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/locations/regions?country_id=217" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_th": "ภาคเหนือ",
      "name_en": "Northern",
      "country_id": 217,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 6
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'GET-/api/locations/provinces',
      method: 'GET',
      path: '/api/locations/provinces',
      description: 'ดึงรายการจังหวัดตาม country หรือ region (tw_locations_db_views)',
      category: 'MySQL Database',
      subCategory: 'locations',
      requiresAuth: true,
      parameters: [
        { name: 'country_id', type: 'integer', description: 'Filter by country ID' },
        { name: 'region_id', type: 'integer', description: 'Filter by region ID' },
        { name: 'search', type: 'string', description: 'Search by name_th or name_en' },
        { name: 'limit', type: 'integer', description: 'Max records to return (default: 100)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/locations/provinces?country_id=217&search=กรุงเทพ" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_th": "กรุงเทพมหานคร",
      "name_en": "Bangkok",
      "country_id": 217,
      "region_id": 2,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database query failed' }
      ]
    },
    {
      id: 'GET-/api/locations/airports',
      method: 'GET',
      path: '/api/locations/airports',
      description: 'ดึงรายการสนามบินตาม country (tw_locations_db_views)',
      category: 'MySQL Database',
      subCategory: 'locations',
      requiresAuth: true,
      parameters: [
        { name: 'country_id', type: 'integer', description: 'Filter by country ID' },
        { name: 'search', type: 'string', description: 'Search by name_th, name_en, or code' },
        { name: 'limit', type: 'integer', description: 'Max records to return (default: 100)' },
        { name: 'offset', type: 'integer', description: 'Skip records (default: 0)' }
      ],
      curl: `curl "${apiUrl}/api/locations/airports?country_id=217&search=สุวรรณภูมิ" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_th": "ท่าอากาศยานสุวรรณภูมิ",
      "name_en": "Suvarnabhumi Airport",
      "code": "BKK",
      "country_id": 217,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1
  }
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' },
        { status: 500, description: 'Database query failed' }
      ]
    }
  ]

  const filteredEndpoints = endpoints.filter(endpoint => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      endpoint.method.toLowerCase().includes(query) ||
      endpoint.path.toLowerCase().includes(query)
    )
  })

  const selectedEndpointData = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0]

  // Helper to find selected table from database schema
  const getSelectedTable = () => {
    if (!selectedEndpoint.startsWith('table-') || !databaseTables) return null
    const parts = selectedEndpoint.split('-')
    const dbKey = parts[1]
    const tableName = parts.slice(2).join('-')
    const db = databaseTables.databases.find((d: any) => d.database_key === dbKey)
    if (!db) return null
    const table = db.tables.find((t: any) => t.table_name === tableName)
    if (!table) return null
    return { ...table, database: db }
  }
  const selectedTable = getSelectedTable()

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Only show documentation if authenticated
  if (!isAuthenticated) {
    return null
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Top Navigation */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        flexShrink: 0
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              Finance Backoffice API
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: healthStatus?.status === 'ok' ? '#ecfdf5' : '#fef2f2',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: healthStatus?.status === 'ok' ? '#065f46' : '#991b1b'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: healthStatus?.status === 'ok' ? '#10b981' : '#ef4444'
              }} />
              {loading ? 'Checking...' : healthStatus?.status === 'ok' ? 'Operational' : 'Offline'}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.375rem 0.875rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 2rem 0 2rem',
          flexShrink: 0
        }}>
          {/* Hero */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              API Documentation
            </h1>
            <p style={{
              margin: 0,
              fontSize: '1.125rem',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              RESTful API for financial reporting and backoffice operations
            </p>
          </div>
        </div>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        display: 'flex'
      }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Endpoints List */}
        <div style={{
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
          height: '100%',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1.5rem 1rem', flexShrink: 0 }}>
            <h2 style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '0 0.5rem'
            }}>
              Endpoints
            </h2>
            
            {/* Search Box */}
            <div style={{
              position: 'relative',
              marginBottom: '1rem',
              padding: '0 0.5rem'
            }}>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#9ca3af" 
                strokeWidth="2"
                style={{
                  position: 'absolute',
                  left: '1.25rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#111827',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Results count */}
            {searchQuery && (
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '0.75rem',
                padding: '0 0.5rem'
              }}>
                {filteredEndpoints.length} {filteredEndpoints.length === 1 ? 'result' : 'results'}
              </div>
            )}
            
            {filteredEndpoints.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {!searchQuery ? (
                  // Group by category and subCategory when not searching
                  (() => {
                    // Define category order
                    const categoryOrder = ['API Reference', 'System', 'MySQL Database', 'Supabase']

                    // Group by category first, then by subCategory
                    const grouped = filteredEndpoints.reduce((acc: any, endpoint) => {
                      const cat = endpoint.category || 'Other'
                      const subCat = endpoint.subCategory || 'other'
                      if (!acc[cat]) acc[cat] = {}
                      if (!acc[cat][subCat]) acc[cat][subCat] = []
                      acc[cat][subCat].push(endpoint)
                      return acc
                    }, {})

                    // Sort endpoints alphabetically by path within each subCategory
                    Object.keys(grouped).forEach(cat => {
                      Object.keys(grouped[cat]).forEach(subCat => {
                        grouped[cat][subCat].sort((a: any, b: any) => a.path.localeCompare(b.path))
                      })
                    })

                    // Sort categories by defined order
                    const sortedCategories = Object.keys(grouped).sort((a, b) => {
                      const indexA = categoryOrder.indexOf(a)
                      const indexB = categoryOrder.indexOf(b)
                      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
                      if (indexA === -1) return 1
                      if (indexB === -1) return -1
                      return indexA - indexB
                    })

                    return sortedCategories.map((category) => {
                      const subCategories = Object.keys(grouped[category]).sort()
                      const hasMultipleSubCategories = subCategories.length > 1 ||
                        (subCategories.length === 1 && subCategories[0] !== 'health' && subCategories[0] !== 'date-formats')

                      return (
                        <div key={category} style={{ marginBottom: '1rem' }}>
                          {/* Category Header */}
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '0.5rem 0.5rem 0.375rem',
                            marginTop: category !== 'API Reference' ? '0.5rem' : '0'
                          }}>
                            {category}
                          </div>

                          {/* SubCategories with Accordion */}
                          {hasMultipleSubCategories ? (
                            subCategories.map((subCat) => {
                              const isExpanded = expandedSubCategory === `${category}-${subCat}`
                              const endpointsInSubCat = grouped[category][subCat]

                              return (
                                <div key={subCat} style={{ marginBottom: '0.25rem' }}>
                                  {/* SubCategory Header (Clickable) */}
                                  <button
                                    onClick={() => setExpandedSubCategory(isExpanded ? null : `${category}-${subCat}`)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      padding: '0.625rem 0.75rem',
                                      background: isExpanded ? '#f3f4f6' : 'transparent',
                                      border: 'none',
                                      borderLeft: isExpanded ? '3px solid #6366f1' : '3px solid transparent',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isExpanded) e.currentTarget.style.background = '#f9fafb'
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isExpanded) e.currentTarget.style.background = 'transparent'
                                    }}
                                  >
                                    <span style={{
                                      fontSize: '0.8125rem',
                                      fontWeight: '600',
                                      color: isExpanded ? '#4f46e5' : '#374151',
                                      textTransform: 'capitalize'
                                    }}>
                                      {subCat}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{
                                        fontSize: '0.6875rem',
                                        color: '#9ca3af',
                                        background: '#f3f4f6',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '10px'
                                      }}>
                                        {endpointsInSubCat.length}
                                      </span>
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#9ca3af"
                                        strokeWidth="2"
                                        style={{
                                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                          transition: 'transform 0.2s'
                                        }}
                                      >
                                        <polyline points="6 9 12 15 18 9"/>
                                      </svg>
                                    </div>
                                  </button>

                                  {/* Expanded Endpoints */}
                                  {isExpanded && (
                                    <div style={{
                                      paddingLeft: '0.5rem',
                                      borderLeft: '1px solid #e5e7eb',
                                      marginLeft: '0.75rem',
                                      marginTop: '0.25rem'
                                    }}>
                                      {endpointsInSubCat.map((endpoint: any) => (
                                        <EndpointListItem
                                          key={endpoint.id}
                                          endpoint={endpoint}
                                          isSelected={selectedEndpoint === endpoint.id}
                                          onClick={() => setSelectedEndpoint(endpoint.id)}
                                          searchQuery={searchQuery}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            // For categories with single subCategory (like System, API Reference), show endpoints directly
                            subCategories.map((subCat) => (
                              grouped[category][subCat].map((endpoint: any) => (
                                <EndpointListItem
                                  key={endpoint.id}
                                  endpoint={endpoint}
                                  isSelected={selectedEndpoint === endpoint.id}
                                  onClick={() => setSelectedEndpoint(endpoint.id)}
                                  searchQuery={searchQuery}
                                />
                              ))
                            ))
                          )}
                        </div>
                      )
                    })
                  })()
                ) : null}

                {/* Dynamic Database Schema Section */}
                {!searchQuery && databaseTables && (
                  <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '0.5rem 0.5rem 0.375rem',
                      marginTop: '0.5rem'
                    }}>
                      📊 Database Schema (Live)
                    </div>
                    {databaseTables.databases.map((db: any) => {
                      const isExpanded = expandedSubCategory === `db-${db.database_key}`
                      return (
                        <div key={db.database_key} style={{ marginBottom: '0.25rem' }}>
                          <button
                            onClick={() => setExpandedSubCategory(isExpanded ? null : `db-${db.database_key}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0.625rem 0.75rem',
                              background: isExpanded ? '#ecfdf5' : 'transparent',
                              border: 'none',
                              borderLeft: isExpanded ? '3px solid #10b981' : '3px solid transparent',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isExpanded) e.currentTarget.style.background = '#f0fdf4'
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded) e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <span style={{
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              color: isExpanded ? '#059669' : '#374151'
                            }}>
                              {db.database_key}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                fontSize: '0.6875rem',
                                color: '#059669',
                                background: '#d1fae5',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px'
                              }}>
                                {db.table_count} tables
                              </span>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#9ca3af"
                                strokeWidth="2"
                                style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s'
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </div>
                          </button>
                          {isExpanded && (
                            <div style={{
                              paddingLeft: '0.5rem',
                              borderLeft: '1px solid #d1fae5',
                              marginLeft: '0.75rem',
                              marginTop: '0.25rem',
                              maxHeight: '300px',
                              overflowY: 'auto'
                            }}>
                              {db.tables.map((table: any) => (
                                <div
                                  key={table.table_name}
                                  onClick={() => setSelectedEndpoint(`table-${db.database_key}-${table.table_name}`)}
                                  style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    background: selectedEndpoint === `table-${db.database_key}-${table.table_name}` ? '#ecfdf5' : 'transparent',
                                    borderLeft: selectedEndpoint === `table-${db.database_key}-${table.table_name}` ? '2px solid #10b981' : '2px solid transparent',
                                    marginBottom: '0.25rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedEndpoint !== `table-${db.database_key}-${table.table_name}`) {
                                      e.currentTarget.style.background = '#f0fdf4'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedEndpoint !== `table-${db.database_key}-${table.table_name}`) {
                                      e.currentTarget.style.background = 'transparent'
                                    }
                                  }}
                                >
                                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#065f46', fontFamily: 'Monaco, Consolas, monospace' }}>
                                    {table.table_name}
                                  </div>
                                  <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.125rem' }}>
                                    {table.column_count} columns • {table.table_rows || 0} rows
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div style={{
                      fontSize: '0.6875rem',
                      color: '#9ca3af',
                      padding: '0.5rem',
                      textAlign: 'center',
                      borderTop: '1px solid #e5e7eb',
                      marginTop: '0.5rem'
                    }}>
                      {databaseTables.summary.total_tables} tables • {databaseTables.summary.total_columns} columns
                    </div>
                  </div>
                )}

                {/* Frontend Pages & API Mapping Section */}
                {!searchQuery && (
                  <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '0.5rem 0.5rem 0.375rem',
                      marginTop: '0.5rem'
                    }}>
                      Frontend Pages
                    </div>
                    {[
                      { id: 'fe-sales-by-country', label: '/sales-by-country', desc: 'รายงานตามประเทศ' },
                      { id: 'fe-wholesale-destinations', label: '/wholesale-destinations', desc: 'Wholesale x ประเทศ' },
                      { id: 'fe-order-report', label: '/order-report', desc: 'Order Report' },
                      { id: 'fe-tour-image-manager', label: '/tour-image-manager', desc: 'Tour Image Manager' },
                    ].map((page) => (
                      <div
                        key={page.id}
                        onClick={() => setSelectedEndpoint(page.id)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          background: selectedEndpoint === page.id ? '#f3f4f6' : 'transparent',
                          borderLeft: selectedEndpoint === page.id ? '3px solid #6b7280' : '3px solid transparent',
                          marginBottom: '0.25rem',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedEndpoint !== page.id) e.currentTarget.style.background = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          if (selectedEndpoint !== page.id) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#374151', fontFamily: 'Monaco, Consolas, monospace' }}>
                          {page.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          {page.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && filteredEndpoints.length > 0 && (
                  // Show flat list when searching
                  filteredEndpoints.map((endpoint) => (
                    <EndpointListItem
                      key={endpoint.id}
                      endpoint={endpoint}
                      isSelected={selectedEndpoint === endpoint.id}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </div>
            ) : (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                    style={{
                      margin: '0 auto 0.75rem',
                      opacity: 0.5
                    }}
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <div>No endpoints found</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Try a different search term
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Right Content - Selected Endpoint Detail or Table Detail */}
        <div style={{
          background: '#fafafa',
          overflowY: 'auto',
          height: '100%',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}>
          {selectedEndpoint?.startsWith('fe-') ? (
            <div style={{ padding: '2rem', maxWidth: '1000px' }}>
              {/* Frontend Page Detail */}
              {selectedEndpoint === 'fe-sales-by-country' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>PAGE</span>
                  </div>
                  <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>/sales-by-country.html</h1>
                  <p style={{ margin: '0 0 2rem', color: '#6b7280', fontSize: '0.875rem' }}>รายงานยอดขายตามประเทศ - KPI Cards, ตารางประเทศ, ตาราง Supplier</p>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>API Endpoints ที่ใช้</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Endpoint</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>ใช้ทำอะไร</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['GET /api/reports/summary', 'KPI Cards (orders, ลูกค้า, ยอดรวม, เฉลี่ย)'],
                          ['GET /api/reports/by-country', 'ตารางแยกตามประเทศ'],
                          ['GET /api/reports/by-supplier', 'ตารางแยกตาม Supplier'],
                          ['GET /api/reports/available-periods', 'Dropdown เลือกปี / ไตรมาส / เดือน'],
                          ['GET /api/reports/countries', 'Dropdown เลือกประเทศ'],
                        ].map(([ep, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>{ep}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Filters ที่ส่ง</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Parameter</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['booking_date_from', 'วันจองเริ่มต้น (YYYY-MM-DD) จาก Dropdown ปี'],
                          ['booking_date_to', 'วันจองสิ้นสุด (YYYY-MM-DD) จาก Dropdown ปี'],
                          ['country_id', 'ID ประเทศ (comma-separated) จาก Dropdown ประเทศ'],
                          ['supplier_id', 'ID Supplier (comma-separated)'],
                        ].map(([param, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500' }}>{param}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedEndpoint === 'fe-wholesale-destinations' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>PAGE</span>
                  </div>
                  <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>/wholesale-destinations.html</h1>
                  <p style={{ margin: '0 0 2rem', color: '#6b7280', fontSize: '0.875rem' }}>รายงาน Wholesale แยกตามประเทศปลายทาง (Pivot Table)</p>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>API Endpoints ที่ใช้</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Endpoint</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>ใช้ทำอะไร</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['GET /api/reports/wholesale-by-country', 'ตาราง Pivot (Wholesale x Country)'],
                          ['GET /api/reports/available-periods', 'Dropdown เลือกปี / ไตรมาส / เดือน'],
                          ['GET /api/reports/countries', 'Dropdown เลือกประเทศ'],
                          ['GET /api/suppliers', 'Dropdown เลือก Wholesale'],
                        ].map(([ep, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>{ep}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Filters ที่ส่ง</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Parameter</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['booking_date_from', 'วันจองเริ่มต้น (YYYY-MM-DD)'],
                          ['booking_date_to', 'วันจองสิ้นสุด (YYYY-MM-DD)'],
                          ['supplier_id', 'ID Wholesale (comma-separated)'],
                          ['country_id', 'ID ประเทศ (comma-separated)'],
                          ['view_mode', 'sales (ยอดขาย) หรือ travelers (จำนวนคน)'],
                        ].map(([param, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500' }}>{param}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedEndpoint === 'fe-order-report' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>PAGE</span>
                  </div>
                  <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>/order-report.html</h1>
                  <p style={{ margin: '0 0 2rem', color: '#6b7280', fontSize: '0.875rem' }}>Order Report - 5 Tabs (ประเทศ, Supplier, วันเดินทาง, วันจอง, Lead Time)</p>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>API Endpoints ที่ใช้</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Endpoint</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>ใช้ทำอะไร</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['GET /api/reports/summary', 'KPI Cards'],
                          ['GET /api/reports/by-country', 'Tab: แยกตามประเทศ'],
                          ['GET /api/reports/by-supplier', 'Tab: แยกตาม Supplier'],
                          ['GET /api/reports/by-travel-start-date', 'Tab: แยกตามวันเดินทาง'],
                          ['GET /api/reports/by-created-date', 'Tab: แยกตามวันจอง'],
                          ['GET /api/reports/lead-time-analysis', 'Tab: Lead Time Analysis'],
                          ['GET /api/reports/countries', 'Dropdown เลือกประเทศ'],
                          ['GET /api/suppliers', 'Dropdown เลือก Supplier'],
                        ].map(([ep, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>{ep}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Filters ที่ส่ง</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Parameter</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['booking_date_from', 'วันจองเริ่มต้น (YYYY-MM-DD)'],
                          ['booking_date_to', 'วันจองสิ้นสุด (YYYY-MM-DD)'],
                          ['travel_date_from', 'วันเดินทางเริ่มต้น (YYYY-MM-DD)'],
                          ['travel_date_to', 'วันเดินทางสิ้นสุด (YYYY-MM-DD)'],
                          ['country_id', 'ID ประเทศ (comma-separated)'],
                          ['supplier_id', 'ID Supplier (comma-separated)'],
                        ].map(([param, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500' }}>{param}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedEndpoint === 'fe-tour-image-manager' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>PAGE</span>
                  </div>
                  <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>/tour-image-manager.html</h1>
                  <p style={{ margin: '0 0 0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>จัดการรูปภาพทัวร์ - ค้นหา, ดูรายละเอียด, Export CSV/PDF</p>
                  <p style={{ margin: '0 0 2rem', color: '#9ca3af', fontSize: '0.8125rem' }}>API Base: <code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>fin-api.tourwow.com</code></p>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>API Endpoints</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Endpoint</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['GET /vibecode/pre_product_file_reports', 'ค้นหารูปภาพทัวร์ พร้อม pre_product_files'],
                          ['POST /vibecode/pre_product_file_reports', 'Remake / สร้างรายงานใหม่ทั้งหมด'],
                          ['GET .../countries', 'Dropdown เลือกประเทศ'],
                          ['GET .../suppliers', 'Dropdown เลือก Wholesale'],
                        ].map(([ep, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>{ep}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Filters (query parameter: filters=JSON)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Parameter</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['name', 'ชื่อไฟล์รูปภาพ'],
                          ['product_tour_code', 'รหัสทัวร์'],
                          ['supplier_id', 'ID Wholesale/Supplier'],
                          ['country_id', 'ID ประเทศ'],
                          ['min_file_count', 'จำนวนใช้ซ้ำขั้นต่ำ'],
                          ['last_file_created_at_between', '{ min_date, max_date } ช่วงวันที่อัปเดต'],
                        ].map(([param, desc], idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#374151', fontWeight: '500' }}>{param}</td>
                            <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Client-side Features</div>
                    <div style={{ padding: '1.5rem', fontSize: '0.8125rem', color: '#6b7280', lineHeight: '2' }}>
                      <div>Checkbox &quot;แสดงเฉพาะโปรแกรม Banner ลำดับที่ 1&quot; — filter <code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>pre_product_files</code> เฉพาะ <code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>slug=banner, ordinal=1</code></div>
                      <div>Export CSV/PDF — แสดงข้อมูลตาม filter checkbox ปัจจุบัน</div>
                      <div>Sorting — เรียงตาม จำนวนใช้ซ้ำ, Banner 1, Banner 2+, รายละเอียด, วันที่อัปเดต</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Query Conditions - only for finance report pages */}
              {selectedEndpoint !== 'fe-tour-image-manager' && (<>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
                  Query Conditions
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <pre style={{
                    margin: 0,
                    padding: '1rem',
                    background: '#f9fafb',
                    color: '#374151',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.8125rem',
                    lineHeight: '1.8',
                    fontFamily: 'Monaco, Consolas, monospace',
                    overflow: 'auto'
                  }}>{`WHERE o.order_status != 'Canceled'
  AND o.deleted_at IS NULL
  AND o.supplier_commission > 0
  AND EXISTS (
    SELECT 1
    FROM v_Xqc7k7_customer_order_installments ci
    WHERE ci.order_id = o.id
      AND ci.ordinal = 1
      AND ci.status = 'paid'
  )`}</pre>
                  <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#6b7280', lineHeight: '2' }}>
                    <div><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>order_status != Canceled</code> — ไม่นับ order ที่ยกเลิก</div>
                    <div><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>deleted_at IS NULL</code> — ไม่นับ order ที่ถูกลบ</div>
                    <div><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>supplier_commission &gt; 0</code> — เฉพาะ order ที่มีค่าคอมมิชชั่น</div>
                    <div><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '3px', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.75rem' }}>installments.ordinal=1, status=paid</code> — งวดแรกต้องชำระแล้ว</div>
                  </div>
                </div>
              </div>

              {/* Traveler counting */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
                  Traveler Counting
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <pre style={{
                    margin: 0,
                    padding: '1rem',
                    background: '#f9fafb',
                    color: '#374151',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.8125rem',
                    lineHeight: '1.8',
                    fontFamily: 'Monaco, Consolas, monospace',
                    overflow: 'auto'
                  }}>{`LEFT JOIN (
  SELECT order_id, SUM(quantity) as traveler_count
  FROM v_Xqc7k7_order_items
  WHERE product_room_type_id IS NOT NULL
  GROUP BY order_id
) oi_sum ON oi_sum.order_id = o.id`}</pre>
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                    นับจำนวน travelers จาก order_items ที่มี product_room_type_id (ห้องพัก) โดยรวม quantity ของแต่ละ order
                  </p>
                </div>
              </div>
              </>)}
            </div>
          ) : selectedTable ? (
            <div style={{ padding: '2rem', maxWidth: '1000px' }}>
              {/* Table Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#d1fae5',
                    color: '#065f46',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    TABLE
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: '500'
                  }}>
                    {selectedTable.database.database_key}
                  </span>
                </div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#111827', fontFamily: 'Monaco, Consolas, monospace' }}>
                  {selectedTable.table_name}
                </h1>
                <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  {selectedTable.table_comment || 'No description available'}
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                  <span>{selectedTable.column_count} columns</span>
                  <span>{selectedTable.table_rows?.toLocaleString() || 0} rows</span>
                  <span>Database: {selectedTable.database.database_name}</span>
                </div>
              </div>

              {/* Columns Table */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Columns ({selectedTable.columns.length})
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Column Name</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Type</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Key</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Nullable</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Default</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#6b7280' }}>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.columns.map((col: any, idx: number) => (
                        <tr key={col.name} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#111827', fontWeight: '500' }}>
                            {col.name}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#7c3aed', fontSize: '0.75rem' }}>
                            {col.full_type}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                            {col.key === 'PRI' && <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: '600' }}>PK</span>}
                            {col.key === 'MUL' && <span style={{ background: '#dbeafe', color: '#2563eb', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: '600' }}>FK</span>}
                            {col.key === 'UNI' && <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: '600' }}>UQ</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                            {col.nullable ? <span style={{ color: '#9ca3af' }}>YES</span> : <span style={{ color: '#ef4444', fontWeight: '500' }}>NO</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'Monaco, Consolas, monospace', color: '#6b7280', fontSize: '0.75rem' }}>
                            {col.default === null ? <span style={{ color: '#d1d5db' }}>NULL</span> : col.default || '-'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {col.comment || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Database Info */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.5rem',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: '#166534'
              }}>
                <strong>Database:</strong> {selectedTable.database.database_name}<br/>
                <strong>Description:</strong> {selectedTable.database.description}
              </div>
            </div>
          ) : (
            <EndpointDetail endpoint={selectedEndpointData} />
          )}
        </div>
      </div>
      </div>
      </div>
    </main>
  )
}


