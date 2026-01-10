'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Detect current environment and set API URL
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
      background: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Navigation Bar */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#1e40af',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                Finance Backoffice API
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                Enterprise API Platform
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: healthStatus?.status === 'ok' ? '#ecfdf5' : '#fef2f2',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: `1px solid ${healthStatus?.status === 'ok' ? '#d1fae5' : '#fecaca'}`
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: healthStatus?.status === 'ok' ? '#10b981' : '#ef4444',
              animation: healthStatus?.status === 'ok' ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: healthStatus?.status === 'ok' ? '#065f46' : '#991b1b'
            }}>
              {loading ? 'Checking...' : healthStatus?.status === 'ok' ? 'Operational' : 'Offline'}
            </span>
          </div>
        </div>
      </nav>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Hero Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            API Documentation
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            Secure RESTful API for financial reporting and backoffice operations.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <MetricCard label="Total Endpoints" value="8" />
          <MetricCard label="Response Time" value="< 100ms" />
          <MetricCard label="Security" value="API Key" />
          <MetricCard label="Uptime" value="99.9%" />
        </div>

        {/* MySQL Bookings API */}
        <Section title="MySQL Bookings API" icon="📊">
          <EndpointCard
            method="GET"
            path="/api/health"
            description="Health check endpoint to monitor API status"
            curl={`curl ${apiUrl}/api/health`}
            response={`{
  "status": "ok",
  "timestamp": "2026-01-10T...",
  "service": "finance-backoffice-report-api"
}`}
          />

          <EndpointCard
            method="GET"
            path="/api/bookings"
            description="Retrieve booking records with optional limit parameter"
            requiresAuth
            curl={`curl ${apiUrl}/api/bookings?limit=10 \\
  -H 'x-api-key: YOUR_API_KEY'`}
            response={`{
  "success": true,
  "data": [...],
  "total": 10
}`}
            responseExamples={[
              { status: 200, label: 'OK', example: '{ "success": true, "data": [...] }' },
              { status: 401, label: 'Unauthorized', example: '{ "success": false, "error": "Invalid API key" }' },
              { status: 500, label: 'Server Error', example: '{ "success": false, "error": "Database error" }' }
            ]}
          />

          <EndpointCard
            method="POST"
            path="/api/bookings"
            description="Create a new booking record"
            requiresAuth
            curl={`curl -X POST ${apiUrl}/api/bookings \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"title":"New Booking","type":"standard"}'`}
            response={`{
  "success": true,
  "data": {
    "id": 151,
    "title": "New Booking",
    "type": "standard",
    "created_at": "2026-01-10T..."
  }
}`}
            responseExamples={[
              { status: 201, label: 'Created', example: '{ "success": true, "data": {...} }' },
              { status: 400, label: 'Bad Request', example: '{ "success": false, "error": "Missing required fields" }' },
              { status: 401, label: 'Unauthorized', example: '{ "success": false, "error": "Invalid API key" }' }
            ]}
          />
        </Section>

        {/* Supabase Users API */}
        <Section title="Supabase Users API" icon="👥">
          <EndpointCard
            method="GET"
            path="/api/users"
            description="Retrieve user records. Filters: user_id, user_ns, limit"
            requiresAuth
            curl={`curl ${apiUrl}/api/users?limit=10 \\
  -H 'x-api-key: YOUR_API_KEY'`}
            response={`{
  "success": true,
  "data": [{
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
    "created_at": "2026-01-01T...",
    "updated_at": "2026-01-09T..."
  }],
  "total": 1
}`}
            responseExamples={[
              { status: 200, label: 'OK', example: '{ "success": true, "data": [...] }' },
              { status: 401, label: 'Unauthorized', example: '{ "success": false, "error": "Invalid API key" }' },
              { status: 503, label: 'Service Unavailable', example: '{ "success": false, "error": "Supabase not configured" }' }
            ]}
          />

          <EndpointCard
            method="POST"
            path="/api/users"
            description="Create a new user. Required: user_id. Optional: all other fields"
            requiresAuth
            curl={`curl -X POST ${apiUrl}/api/users \\
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
    ...
  }
}`}
            responseExamples={[
              { status: 201, label: 'Created', example: '{ "success": true, "data": {...} }' },
              { status: 400, label: 'Bad Request', example: '{ "success": false, "error": "user_id required" }' },
              { status: 500, label: 'Server Error', example: '{ "success": false, "error": "Duplicate key" }' }
            ]}
          />

          <EndpointCard
            method="PUT"
            path="/api/users"
            description="Update user. Required: user_id. Send only fields to update"
            requiresAuth
            curl={`curl -X PUT ${apiUrl}/api/users \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "user_id": "U1234567890abcdef",
    "first_name": "Somchai Updated"
  }'`}
            response={`{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "U1234567890abcdef",
    "first_name": "Somchai Updated",
    ...
  }
}`}
            responseExamples={[
              { status: 200, label: 'OK', example: '{ "success": true, "data": {...} }' },
              { status: 400, label: 'Bad Request', example: '{ "success": false, "error": "user_id required" }' }
            ]}
          />

          <EndpointCard
            method="GET"
            path="/api/chat-history"
            description="Get chat_history for a user. Required: user_id parameter"
            requiresAuth
            curl={`curl ${apiUrl}/api/chat-history?user_id=U1234567890abcdef \\
  -H 'x-api-key: YOUR_API_KEY'`}
            response={`{
  "success": true,
  "user_id": "U1234567890abcdef",
  "name": "Somchai Jaidee",
  "chat_history": ["You: สวัสดีครับ", "You: ต้องการจองทัวร์"],
  "total": 2
}`}
            responseExamples={[
              { status: 200, label: 'OK', example: '{ "success": true, "chat_history": [...] }' },
              { status: 400, label: 'Bad Request', example: '{ "success": false, "error": "user_id required" }' }
            ]}
          />

          <EndpointCard
            method="POST"
            path="/api/chat-history"
            description="Add message to chat_history. Updates last_interaction timestamp"
            requiresAuth
            curl={`curl -X POST ${apiUrl}/api/chat-history \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "user_id": "U1234567890abcdef",
    "message": "You: ต้องการจองทัวร์ครับ"
  }'`}
            response={`{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "U1234567890abcdef",
    "chat_history": ["You: สวัสดีครับ", "You: ต้องการจองทัวร์ครับ"],
    "last_interaction": "2026-01-10T...",
    ...
  }
}`}
            responseExamples={[
              { status: 201, label: 'Created', example: '{ "success": true, "data": {...} }' },
              { status: 400, label: 'Bad Request', example: '{ "success": false, "error": "user_id and message required" }' }
            ]}
          />

          <EndpointCard
            method="DELETE"
            path="/api/chat-history"
            description="Clear chat_history (set to empty array). Required: user_id parameter"
            requiresAuth
            curl={`curl -X DELETE ${apiUrl}/api/chat-history?user_id=U1234567890abcdef \\
  -H 'x-api-key: YOUR_API_KEY'`}
            response={`{
  "success": true,
  "message": "Chat history cleared"
}`}
            responseExamples={[
              { status: 200, label: 'OK', example: '{ "success": true, "message": "Chat history cleared" }' },
              { status: 400, label: 'Bad Request', example: '{ "success": false, "error": "user_id required" }' }
            ]}
          />
        </Section>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  )
}

function MetricCard({ label, value }: any) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {label}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: any) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{
        margin: '0 0 1.5rem 0',
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #f3f4f6'
      }}>
        <span>{icon}</span>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  )
}

function EndpointCard({ method, path, description, curl, response, requiresAuth, responseExamples }: any) {
  const [showExample, setShowExample] = useState(false)
  const [showResponses, setShowResponses] = useState(false)
  const [copied, setCopied] = useState(false)

  const methodStyles: any = {
    GET: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    POST: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
    PUT: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    DELETE: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
  }

  const style = methodStyles[method] || methodStyles.GET

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      transition: 'box-shadow 0.2s',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <span style={{
          background: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          padding: '0.25rem 0.75rem',
          borderRadius: '6px',
          fontWeight: '600',
          fontSize: '0.875rem'
        }}>
          {method}
        </span>
        <code style={{
          fontSize: '0.9375rem',
          color: '#111827',
          fontWeight: '500',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {path}
        </code>
        {requiresAuth && (
          <span style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            background: '#f3f4f6',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Auth Required
          </span>
        )}
      </div>

      <p style={{
        margin: '0 0 0.75rem 0',
        color: '#4b5563',
        fontSize: '0.875rem',
        lineHeight: '1.5'
      }}>
        {description}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowExample(!showExample)}
          style={{
            background: showExample ? '#e0e7ff' : '#ffffff',
            color: '#4f46e5',
            border: '1px solid #c7d2fe',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: '500'
          }}
        >
          {showExample ? '▼ Hide' : '▶ Show'} Example
        </button>

        {responseExamples && (
          <button
            onClick={() => setShowResponses(!showResponses)}
            style={{
              background: showResponses ? '#f3f4f6' : '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: '500'
            }}
          >
            {showResponses ? '▼ Hide' : '▶ Show'} Responses ({responseExamples.length})
          </button>
        )}
      </div>

      {showExample && (
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#ffffff',
          border: '2px solid #e0e7ff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <strong style={{ fontSize: '0.8125rem', color: '#374151' }}>Request</strong>
              <button
                onClick={() => copyToClipboard(curl)}
                style={{
                  background: copied ? '#d1fae5' : '#f1f5f9',
                  color: copied ? '#065f46' : '#475569',
                  border: `1px solid ${copied ? '#a7f3d0' : '#cbd5e1'}`,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{
              background: '#1f2937',
              color: '#e5e7eb',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '0.75rem',
              lineHeight: '1.5',
              fontFamily: 'Monaco, Consolas, monospace',
              margin: 0
            }}>
              {curl}
            </pre>
          </div>

          <div>
            <strong style={{ fontSize: '0.8125rem', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
              Response (Success)
            </strong>
            <pre style={{
              background: '#1f2937',
              color: '#e5e7eb',
              padding: '1rem',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '0.75rem',
              lineHeight: '1.5',
              fontFamily: 'Monaco, Consolas, monospace',
              margin: 0
            }}>
              {response}
            </pre>
          </div>
        </div>
      )}

      {showResponses && responseExamples && (
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#f9fafb',
          border: '2px solid #d1d5db',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <strong style={{ fontSize: '0.8125rem', color: '#374151', display: 'block', marginBottom: '0.75rem' }}>
            Response Examples
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {responseExamples.map((ex: any, idx: number) => (
              <div key={idx} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#ffffff'
              }}>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: ex.status < 300 ? '#f0fdf4' : ex.status < 400 ? '#fef3c7' : '#fee2e2',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: ex.status < 300 ? '#166534' : ex.status < 400 ? '#92400e' : '#991b1b'
                }}>
                  {ex.status} {ex.label}
                </div>
                <pre style={{
                  background: '#f9fafb',
                  color: '#374151',
                  padding: '0.75rem',
                  margin: 0,
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  fontFamily: 'Monaco, Consolas, monospace',
                  overflow: 'auto'
                }}>
                  {ex.example}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
