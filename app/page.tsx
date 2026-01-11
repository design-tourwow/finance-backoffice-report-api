'use client'

import { useState, useEffect } from 'react'

// Helper Components
function EndpointListItem({ endpoint, isSelected, onClick, searchQuery }: any) {
  const methodColors: any = {
    GET: { bg: '#dbeafe', text: '#1e40af' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' }
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
  const [showErrorExamples, setShowErrorExamples] = useState(false)

  const methodColors: any = {
    GET: { bg: '#dbeafe', text: '#1e40af' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' }
  }

  const color = methodColors[endpoint.method] || methodColors.GET

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      minHeight: '100%'
    }}>
      {/* Left - Documentation */}
      <div>
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
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          background: '#fee2e2',
                          borderBottom: '1px solid #fecaca',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          color: '#991b1b'
                        }}>
                          {resp.status} - {resp.description}
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '0.75rem',
                          fontSize: '0.8125rem',
                          lineHeight: '1.5',
                          fontFamily: 'Monaco, Consolas, monospace',
                          color: '#7f1d1d',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState('GET-/api/health')
  const [apiUrl, setApiUrl] = useState('http://localhost:3000')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Set API URL on client side only to avoid hydration mismatch
    setApiUrl(window.location.origin)
  }, [])

  // Define all endpoints
  const endpoints = [
    {
      id: 'GET-/api/health',
      method: 'GET',
      path: '/api/health',
      description: 'Health check endpoint to monitor API status',
      category: 'System',
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
      category: 'MySQL - Bookings',
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
      category: 'MySQL - Bookings',
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
      category: 'Supabase - Users',
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
      category: 'Supabase - Users',
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
      category: 'Supabase - Users',
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
      category: 'Supabase - Chat',
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
      category: 'Supabase - Chat',
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
      id: 'DELETE-/api/chat-history',
      method: 'DELETE',
      path: '/api/chat-history',
      description: 'Clear chat_history for a user',
      category: 'Supabase - Chat',
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

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
                  // Group by category when not searching
                  (() => {
                    const grouped = filteredEndpoints.reduce((acc: any, endpoint) => {
                      const cat = endpoint.category || 'Other'
                      if (!acc[cat]) acc[cat] = []
                      acc[cat].push(endpoint)
                      return acc
                    }, {})
                    
                    return Object.entries(grouped).map(([category, eps]: any) => (
                      <div key={category} style={{ marginBottom: '1rem' }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '0.5rem 0.5rem 0.375rem',
                          marginTop: category !== 'System' ? '0.5rem' : '0'
                        }}>
                          {category}
                        </div>
                        {eps.map((endpoint: any) => (
                          <EndpointListItem
                            key={endpoint.id}
                            endpoint={endpoint}
                            isSelected={selectedEndpoint === endpoint.id}
                            onClick={() => setSelectedEndpoint(endpoint.id)}
                            searchQuery={searchQuery}
                          />
                        ))}
                      </div>
                    ))
                  })()
                ) : (
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

        {/* Right Content - Selected Endpoint Detail */}
        <div style={{
          background: '#fafafa',
          overflowY: 'auto',
          height: '100%',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}>
          <EndpointDetail endpoint={selectedEndpointData} />
        </div>
      </div>
      </div>
      </div>
    </main>
  )
}


