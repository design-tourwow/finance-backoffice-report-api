'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3002'

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

        {/* Endpoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <EndpointSection
            method="GET"
            path="/api/health"
            description="Health check endpoint to monitor API status and availability"
            curl={`curl ${apiUrl}/api/health`}
            response={`{
  "status": "ok",
  "timestamp": "2026-01-10T12:00:00Z",
  "service": "finance-backoffice-report-api"
}`}
            responses={[
              { status: 200, description: 'Successful response' }
            ]}
          />

          <EndpointSection
            method="GET"
            path="/api/users"
            description="Retrieve user records from Supabase users table"
            requiresAuth
            parameters={[
              { name: 'user_id', type: 'string', description: 'Filter by specific user ID' },
              { name: 'user_ns', type: 'string', description: 'Filter by namespace (e.g., "line")' },
              { name: 'name', type: 'string', description: 'Search by name (case-insensitive)' },
              { name: 'limit', type: 'integer', description: 'Max records to return (default: 100, max: 1000)' },
              { name: 'offset', type: 'integer', description: 'Number of records to skip (default: 0)' },
              { name: 'sort_by', type: 'string', description: 'Field to sort by (id, name, created_at, etc.)' },
              { name: 'sort_order', type: 'string', description: 'Sort direction: asc or desc' }
            ]}
            curl={`curl "${apiUrl}/api/users?limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_ns": "line",
      "user_id": "U1234567890abcdef",
      "first_name": "Somchai",
      "last_name": "Jaidee",
      "name": "Somchai Jaidee",
      "profile_pic": "https://...",
      "subscribed": "2024-12-06T08:29:36+00:00",
      "last_interaction": "2024-12-06T08:31:02+00:00",
      "chat_history": ["You: สวัสดีครับ"],
      "created_at": "2026-01-01T08:00:00.123456+00:00",
      "updated_at": "2026-01-09T10:00:00.456789+00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "returned": 1
  }
}`}
            responses={[
              { status: 200, description: 'Successful response with user data' },
              { status: 400, description: 'Invalid parameters (e.g., limit > 1000)' },
              { status: 401, description: 'Invalid or missing API key' },
              { status: 503, description: 'Supabase not configured' }
            ]}
          />

          <EndpointSection
            method="POST"
            path="/api/users"
            description="Create a new user record. Only user_id is required, all other fields are optional."
            requiresAuth
            requestBody={{
              user_id: { type: 'string', required: true, description: 'Unique user identifier' },
              user_ns: { type: 'string', required: false, description: 'Namespace (e.g., "line")' },
              first_name: { type: 'string', required: false, description: 'User first name' },
              last_name: { type: 'string', required: false, description: 'User last name' },
              name: { type: 'string', required: false, description: 'Full name' },
              profile_pic: { type: 'string', required: false, description: 'Profile picture URL' },
              subscribed: { type: 'timestamp', required: false, description: 'Subscription timestamp' },
              last_interaction: { type: 'timestamp', required: false, description: 'Last interaction timestamp' },
              chat_history: { type: 'array', required: false, description: 'Array of chat messages' }
            }}
            curl={`curl -X POST "${apiUrl}/api/users" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "user_ns": "line",
    "user_id": "U9876543210fedcba",
    "first_name": "Somying",
    "last_name": "Raksanuk",
    "name": "Somying Raksanuk",
    "profile_pic": "https://...",
    "subscribed": "2026-01-09T10:00:00+00:00",
    "last_interaction": "2026-01-09T10:00:00+00:00",
    "chat_history": ["You: สวัสดีครับ"]
  }'`}
            response={`{
  "success": true,
  "data": {
    "id": 2,
    "user_ns": "line",
    "user_id": "U9876543210fedcba",
    "first_name": "Somying",
    "last_name": "Raksanuk",
    "name": "Somying Raksanuk",
    "profile_pic": "https://...",
    "subscribed": "2026-01-09T10:00:00+00:00",
    "last_interaction": "2026-01-09T10:00:00+00:00",
    "chat_history": ["You: สวัสดีครับ"],
    "created_at": "2026-01-09T10:00:00.123456+00:00",
    "updated_at": "2026-01-09T10:00:00.123456+00:00"
  }
}`}
            responses={[
              { status: 201, description: 'User created successfully' },
              { status: 400, description: 'Missing user_id or invalid data format' },
              { status: 401, description: 'Invalid or missing API key' },
              { status: 409, description: 'User with this user_id already exists' },
              { status: 503, description: 'Supabase not configured' }
            ]}
          />
        </div>
      </div>
    </main>
  )
}

function EndpointSection({ method, path, description, requiresAuth, parameters, requestBody, curl, response, responses }: any) {
  const [copied, setCopied] = useState(false)

  const methodColors: any = {
    GET: { bg: '#dbeafe', text: '#1e40af' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' }
  }

  const color = methodColors[method] || methodColors.GET

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
      padding: '2rem 0',
      borderBottom: '1px solid #e5e7eb'
    }}>
      {/* Left Column - Documentation */}
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{
              background: color.bg,
              color: color.text,
              padding: '0.25rem 0.75rem',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.875rem',
              letterSpacing: '0.5px'
            }}>
              {method}
            </span>
            <code style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {path}
            </code>
          </div>
          {requiresAuth && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              color: '#6b7280',
              background: '#f9fafb',
              padding: '0.25rem 0.625rem',
              borderRadius: '4px',
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
          margin: '0 0 1.5rem 0',
          fontSize: '0.9375rem',
          color: '#4b5563',
          lineHeight: '1.6'
        }}>
          {description}
        </p>

        {/* Parameters */}
        {parameters && parameters.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Query Parameters
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {parameters.map((param: any, idx: number) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
                      background: '#ffffff',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {param.type}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.8125rem',
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
        {requestBody && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Request Body
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(requestBody).map(([key, value]: any, idx: number) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
                      background: '#ffffff',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '3px',
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
                    fontSize: '0.8125rem',
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
            margin: '0 0 0.75rem 0',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Responses
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {responses.map((resp: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
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
                  fontSize: '0.8125rem',
                  color: '#4b5563'
                }}>
                  {resp.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Code Examples (Sticky) */}
      <div style={{
        position: 'sticky',
        top: '5rem',
        height: 'fit-content'
      }}>
        <div style={{
          background: '#1f2937',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #374151'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            background: '#111827',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
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
              onClick={() => copyToClipboard(curl)}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: copied ? '#10b981' : '#9ca3af',
                border: 'none',
                padding: '0.375rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
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

          {/* Code */}
          <pre style={{
            margin: 0,
            padding: '1rem',
            color: '#e5e7eb',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            fontFamily: 'Monaco, Consolas, monospace',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {curl}
          </pre>
        </div>

        {/* Response Example */}
        <div style={{
          background: '#1f2937',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #374151',
          marginTop: '1rem'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#111827',
            borderBottom: '1px solid #374151'
          }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Response
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
            maxHeight: '400px'
          }}>
            {response}
          </pre>
        </div>
      </div>
    </div>
  )
}
