'use client'

import { useState, useEffect } from 'react'

// Helper Components
function EndpointListItem({ endpoint, isSelected, onClick }: any) {
  const methodColors: any = {
    GET: { bg: '#dbeafe', text: '#1e40af' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' }
  }

  const color = methodColors[endpoint.method] || methodColors.GET

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
        {endpoint.method}
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
        {endpoint.path}
      </code>
    </button>
  )
}

function EndpointDetail({ endpoint }: any) {
  const [copied, setCopied] = useState(false)

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
            flex: 1
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
            flex: 1
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
      requiresAuth: true,
      parameters: [
        { name: 'limit', type: 'integer', description: 'Max records to return' }
      ],
      curl: `curl "${apiUrl}/api/bookings?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [...],
  "total": 10
}`,
      responses: [
        { status: 200, description: 'Successful response' },
        { status: 401, description: 'Invalid API key' }
      ]
    },
    {
      id: 'POST-/api/bookings',
      method: 'POST',
      path: '/api/bookings',
      description: 'Create a new booking record',
      requiresAuth: true,
      requestBody: {
        title: { type: 'string', required: true, description: 'Booking title' },
        type: { type: 'string', required: true, description: 'Booking type' }
      },
      curl: `curl -X POST "${apiUrl}/api/bookings" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"title":"New Booking","type":"standard"}'`,
      response: `{
  "success": true,
  "data": {
    "id": 151,
    "title": "New Booking",
    "type": "standard",
    "created_at": "2026-01-10T..."
  }
}`,
      responses: [
        { status: 201, description: 'Created successfully' },
        { status: 400, description: 'Missing required fields' },
        { status: 401, description: 'Invalid API key' }
      ]
    },
    {
      id: 'GET-/api/users',
      method: 'GET',
      path: '/api/users',
      description: 'Retrieve user records from Supabase',
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
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Navigation */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
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
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Hero */}
        <div style={{ marginBottom: '3rem' }}>
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 0,
        height: 'calc(100vh - 4rem)',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Endpoints List */}
        <div style={{
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
          height: '100%'
        }}>
          <div style={{ padding: '1.5rem 1rem' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {endpoints.map((endpoint) => (
                <EndpointListItem
                  key={endpoint.id}
                  endpoint={endpoint}
                  isSelected={selectedEndpoint === endpoint.id}
                  onClick={() => setSelectedEndpoint(endpoint.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Selected Endpoint Detail */}
        <div style={{
          background: '#fafafa',
          overflowY: 'auto',
          height: '100%'
        }}>
          <EndpointDetail endpoint={selectedEndpointData} />
        </div>
      </div>
      </div>
    </main>
  )
}


