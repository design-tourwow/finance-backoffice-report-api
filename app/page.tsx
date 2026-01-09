'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTryItEndpoint, setActiveTryItEndpoint] = useState<string | null>(null)
  const [sampleData, setSampleData] = useState<any>(null)

  // Detect current environment and set API URL
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3002'

  useEffect(() => {
    // Fetch health status
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch sample data from database
    fetch('/api/bookings?limit=2', {
      headers: {
        'x-api-key': 'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setSampleData(data.data[0])
        }
      })
      .catch(err => console.error('Failed to fetch sample data:', err))
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
          maxWidth: '1400px',
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
              justifyContent: 'center',
              fontSize: '1.25rem'
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
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* Hero Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '3rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.75rem'
          }}>
            API Documentation
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1.125rem',
            color: '#6b7280',
            lineHeight: '1.75',
            maxWidth: '800px'
          }}>
            Secure and reliable RESTful API for financial reporting and backoffice operations. 
            Built for enterprise-grade performance and scalability.
          </p>
          
          {healthStatus && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              display: 'inline-block'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <strong style={{ color: '#374151' }}>Last Health Check:</strong>{' '}
                {new Date(healthStatus.timestamp).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <MetricCard
            label="Total Endpoints"
            value="8"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            }
            description="Available API routes"
          />
          <MetricCard
            label="Response Time"
            value="< 100ms"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            }
            description="Average latency"
          />
          <MetricCard
            label="Security"
            value="API Key"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            }
            description="Authentication method"
          />
          <MetricCard
            label="Uptime"
            value="99.9%"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            }
            description="Service availability"
          />
        </div>

        {/* API Endpoints Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '2.5rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid #f3f4f6'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#eff6ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <path d="M11 8a3 3 0 00-3 3"/>
              </svg>
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              API Endpoints
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <EndpointCard
              method="GET"
              path="/api/health"
              description="Health check endpoint to monitor API status and availability"
              example={`curl ${apiUrl}/api/health`}
              response={`{
  "status": "ok",
  "timestamp": "2026-01-06T...",
  "service": "finance-backoffice-report-api"
}`}
              responseExamples={[
                {
                  status: 200,
                  label: 'OK',
                  example: `{
  "status": "ok",
  "timestamp": "2026-01-09T12:00:00Z",
  "service": "finance-backoffice-report-api"
}`
                }
              ]}
              requiresAuth={false}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="GET"
              path="/api/bookings"
              description="Retrieve booking records from Xqc7k7_bookings table with optional limit parameter"
              example={`curl ${apiUrl}/api/bookings?limit=10 \\
  -H 'x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'`}
              response={sampleData ? JSON.stringify({
                success: true,
                data: [sampleData],
                total: 1
              }, null, 2) : `{
  "success": true,
  "data": [
    {
      "id": 1,
      "lead_id": 1,
      "booking_code": "BK230600001",
      "booking_status": "reject",
      "customer_name": "...",
      ...
    }
  ],
  "total": 10
}`}
              responseExamples={[
                {
                  status: 200,
                  label: 'OK',
                  example: `{
  "success": true,
  "data": [...],
  "total": 10
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Database query failed",
  "message": "Connection timeout"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="POST"
              path="/api/bookings"
              description="Create a new booking record in Xqc7k7_bookings table"
              example={`curl -X POST ${apiUrl}/api/bookings \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \\
  -d '{"title":"New Booking","type":"standard"}'`}
              response={`{
  "success": true,
  "data": {
    "id": 151,
    "title": "New Booking",
    "type": "standard",
    "created_at": "2026-01-07T...",
    "status": "pending"
  }
}`}
              defaultBody={JSON.stringify({
                title: "New Booking",
                type: "standard"
              }, null, 2)}
              responseExamples={[
                {
                  status: 201,
                  label: 'Created',
                  example: `{
  "success": true,
  "data": {
    "id": 151,
    "title": "New Booking",
    "type": "standard",
    "created_at": "2026-01-09T...",
    "status": "pending"
  }
}`
                },
                {
                  status: 400,
                  label: 'Bad Request',
                  example: `{
  "success": false,
  "error": "Title and type are required"
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Database insert failed",
  "message": "Duplicate entry"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />
          </div>
        </div>

        {/* Supabase API Endpoints Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '2.5rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid #f3f4f6'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#dcfce7',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827'
              }}>
                Supabase API Endpoints
              </h2>
              <p style={{
                margin: '0.25rem 0 0 0',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                User management and chat history endpoints
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <EndpointCard
              method="GET"
              path="/api/users"
              description="Retrieve user records from Supabase. Optional filters: user_id, limit"
              example={`curl ${apiUrl}/api/users?limit=10 \\
  -H 'x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'`}
              response={`{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_ns": "telegram",
      "user_id": "123456789",
      "first_name": "John",
      "last_name": "Doe",
      "name": "John Doe",
      "profile_pic": "https://...",
      "subscribed": true,
      "last_interaction": "2026-01-09T...",
      "created_at": "2026-01-01T...",
      "updated_at": "2026-01-09T..."
    }
  ],
  "total": 1
}`}
              responseExamples={[
                {
                  status: 200,
                  label: 'OK',
                  example: `{
  "success": true,
  "data": [...],
  "total": 10
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Database query failed"
}`
                },
                {
                  status: 503,
                  label: 'Service Unavailable',
                  example: `{
  "success": false,
  "error": "Supabase not configured"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="POST"
              path="/api/users"
              description="Create a new user record in Supabase"
              example={`curl -X POST ${apiUrl}/api/users \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \\
  -d '{
    "user_ns": "telegram",
    "user_id": "987654321",
    "first_name": "Jane",
    "last_name": "Smith",
    "name": "Jane Smith",
    "subscribed": false
  }'`}
              response={`{
  "success": true,
  "data": {
    "id": 2,
    "user_ns": "telegram",
    "user_id": "987654321",
    "first_name": "Jane",
    "last_name": "Smith",
    "name": "Jane Smith",
    "profile_pic": null,
    "subscribed": false,
    "last_interaction": null,
    "created_at": "2026-01-09T...",
    "updated_at": "2026-01-09T..."
  }
}`}
              defaultBody={JSON.stringify({
                user_ns: "telegram",
                user_id: "987654321",
                first_name: "Jane",
                last_name: "Smith",
                name: "Jane Smith"
              }, null, 2)}
              responseExamples={[
                {
                  status: 201,
                  label: 'Created',
                  example: `{
  "success": true,
  "data": {
    "id": 2,
    "user_ns": "telegram",
    "user_id": "987654321",
    "first_name": "Jane",
    "last_name": "Smith",
    "name": "Jane Smith",
    "created_at": "2026-01-09T..."
  }
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Duplicate key value violates unique constraint"
}`
                },
                {
                  status: 503,
                  label: 'Service Unavailable',
                  example: `{
  "success": false,
  "error": "Supabase not configured"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="PUT"
              path="/api/users"
              description="Update an existing user record. Requires user_id in request body"
              example={`curl -X PUT ${apiUrl}/api/users \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \\
  -d '{
    "user_id": "123456789",
    "subscribed": true,
    "last_interaction": "2026-01-09T10:30:00Z"
  }'`}
              response={`{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "123456789",
    "subscribed": true,
    "last_interaction": "2026-01-09T10:30:00Z",
    "updated_at": "2026-01-09T..."
  }
}`}
              defaultBody={JSON.stringify({
                user_id: "123456789",
                first_name: "John",
                last_name: "Doe"
              }, null, 2)}
              responseExamples={[
                {
                  status: 200,
                  label: 'OK',
                  example: `{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "123456789",
    "first_name": "John",
    "last_name": "Doe",
    "updated_at": "2026-01-09T..."
  }
}`
                },
                {
                  status: 400,
                  label: 'Bad Request',
                  example: `{
  "success": false,
  "error": "user_id is required"
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized - Invalid API key"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Update failed"
}`
                },
                {
                  status: 503,
                  label: 'Service Unavailable',
                  example: `{
  "success": false,
  "error": "Supabase not configured"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="GET"
              path="/api/chat-history"
              description="Retrieve chat history for a specific user. Requires user_id parameter"
              example={`curl ${apiUrl}/api/chat-history?user_id=123456789 \\
  -H 'x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'`}
              response={`{
  "success": true,
  "user_id": "123456789",
  "name": "John Doe",
  "chat_history": [
    "You: ลูกนำ้ช่วยเช็ค1-6เมยยังว่างมั้ยคะ5ที่",
    "You: ที่ถามพี่เดินทางตลอดแต่สุดท้ายไปกับคนที่ใจเย็น",
    "You: พี่ไปกับคนที่เค้าหาให้ได้และพูดแบบใจเย็น"
  ],
  "total": 3
}`}
              responseExamples={[
                {
                  status: 200,
                  label: 'OK',
                  example: `{
  "success": true,
  "user_id": "123456789",
  "name": "John Doe",
  "chat_history": ["You: Hello", "You: How are you?"],
  "total": 2
}`
                },
                {
                  status: 400,
                  label: 'Bad Request',
                  example: `{
  "success": false,
  "error": "user_id required"
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Database error"
}`
                },
                {
                  status: 503,
                  label: 'Service Unavailable',
                  example: `{
  "success": false,
  "error": "Supabase not configured"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="POST"
              path="/api/chat-history"
              description="Add a new message to user's chat history"
              example={`curl -X POST ${apiUrl}/api/chat-history \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e" \\
  -d '{
    "user_id": "123456789",
    "message": "You: What are my booking options?"
  }'`}
              response={`{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "123456789",
    "name": "John Doe",
    "chat_history": [
      "You: ลูกนำ้ช่วยเช็ค1-6เมยยังว่างมั้ยคะ5ที่",
      "You: What are my booking options?"
    ],
    "last_interaction": "2026-01-09T12:30:00Z",
    "updated_at": "2026-01-09T12:30:00Z"
  }
}`}
              defaultBody={JSON.stringify({
                user_id: "123456789",
                message: "You: What are my booking options?"
              }, null, 2)}
              responseExamples={[
                {
                  status: 201,
                  label: 'Created',
                  example: `{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "123456789",
    "chat_history": [...],
    "last_interaction": "2026-01-09T..."
  }
}`
                },
                {
                  status: 400,
                  label: 'Bad Request',
                  example: `{
  "success": false,
  "error": "user_id and message required"
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Update failed"
}`
                },
                {
                  status: 503,
                  label: 'Service Unavailable',
                  example: `{
  "success": false,
  "error": "Supabase not configured"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />

            <EndpointCard
              method="DELETE"
              path="/api/chat-history"
              description="Clear all chat history for a specific user"
              example={`curl -X DELETE ${apiUrl}/api/chat-history?user_id=123456789 \\
  -H 'x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e'`}
              response={`{
  "success": true,
  "message": "Chat history cleared"
}`}
              responseExamples={[
                {
                  status: 200,
                  label: 'OK',
                  example: `{
  "success": true,
  "message": "Chat history cleared"
}`
                },
                {
                  status: 400,
                  label: 'Bad Request',
                  example: `{
  "success": false,
  "error": "user_id required"
}`
                },
                {
                  status: 401,
                  label: 'Unauthorized',
                  example: `{
  "success": false,
  "error": "Unauthorized"
}`
                },
                {
                  status: 500,
                  label: 'Internal Server Error',
                  example: `{
  "success": false,
  "error": "Database error"
}`
                },
                {
                  status: 503,
                  label: 'Service Unavailable',
                  example: `{
  "success": false,
  "error": "Supabase not configured"
}`
                }
              ]}
              requiresAuth={true}
              activeTryItEndpoint={activeTryItEndpoint}
              setActiveTryItEndpoint={setActiveTryItEndpoint}
            />
          </div>
        </div>


      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  )
}

function MetricCard({ label, value, icon, description }: any) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      transition: 'box-shadow 0.2s',
      cursor: 'default'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: '#eff6ff',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1e40af'
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2px' }}>
            {label}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
            {value}
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
        {description}
      </div>
    </div>
  )
}

function EndpointCard({ method, path, description, example, response, requiresAuth = true, activeTryItEndpoint, setActiveTryItEndpoint, defaultBody, responseExamples }: any) {
  const [showExample, setShowExample] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Try It states
  const [apiKey, setApiKey] = useState('')
  const [requestBody, setRequestBody] = useState(
    method === 'POST' || method === 'PUT' 
      ? (defaultBody || JSON.stringify({ title: 'Example', type: 'standard' }, null, 2))
      : ''
  )
  const [queryParams, setQueryParams] = useState('')
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [showApiKeyHint, setShowApiKeyHint] = useState(false)

  // Check if this endpoint's Try It is active
  const showTryIt = activeTryItEndpoint === `${method}-${path}`

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

  const toggleTryIt = () => {
    if (showTryIt) {
      // Close if already open
      setActiveTryItEndpoint(null)
      setApiResponse(null)
    } else {
      // Open this one and close others
      setActiveTryItEndpoint(`${method}-${path}`)
      setShowExample(false)
      setApiResponse(null)
    }
  }

  const sendRequest = async () => {
    setLoading(true)
    setApiResponse(null)
    setResponseTime(null)

    try {
      const startTime = performance.now()
      
      let url = path
      if (queryParams) {
        url += `?${queryParams}`
      }

      const headers: any = {
        'Content-Type': 'application/json'
      }

      if (apiKey) {
        headers['x-api-key'] = apiKey
      }

      const options: any = {
        method,
        headers
      }

      if (method !== 'GET' && requestBody) {
        options.body = requestBody
      }

      const res = await fetch(url, options)
      const endTime = performance.now()
      
      const data = await res.json()
      
      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        data
      })
      setResponseTime(Math.round(endTime - startTime))
    } catch (error: any) {
      setApiResponse({
        error: true,
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '1.5rem',
      transition: 'border-color 0.2s'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <span style={{
          background: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          padding: '0.375rem 0.875rem',
          borderRadius: '6px',
          fontWeight: '600',
          fontSize: '0.875rem',
          letterSpacing: '0.025em'
        }}>
          {method}
        </span>
        <code style={{
          fontSize: '1rem',
          color: '#111827',
          fontWeight: '500',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {path}
        </code>
      </div>

      <p style={{
        margin: '0 0 1rem 0',
        color: '#4b5563',
        fontSize: '0.9375rem',
        lineHeight: '1.6'
      }}>
        {description}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowExample(!showExample)}
          style={{
            background: showExample ? '#e0e7ff' : '#ffffff',
            color: '#4f46e5',
            border: '1px solid #c7d2fe',
            padding: '0.625rem 1.25rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={showExample ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/>
          </svg>
          {showExample ? 'Hide Example' : 'Show Example'}
        </button>

        <button
          onClick={toggleTryIt}
          style={{
            background: showTryIt ? '#4f46e5' : '#6366f1',
            color: '#ffffff',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          {showTryIt ? 'Close Try It' : 'Try It Out'}
        </button>
      </div>

      {showExample && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <strong style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                Request
              </strong>
              <button
                onClick={() => copyToClipboard(example)}
                style={{
                  background: copied ? '#d1fae5' : '#f1f5f9',
                  color: copied ? '#065f46' : '#475569',
                  border: `1px solid ${copied ? '#a7f3d0' : '#cbd5e1'}`,
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre style={{
              background: '#1f2937',
              color: '#e5e7eb',
              padding: '1.25rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.8125rem',
              lineHeight: '1.6',
              border: '1px solid #374151',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {example}
            </pre>
          </div>

          <div>
            <strong style={{
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: '600',
              display: 'block',
              marginBottom: '0.75rem'
            }}>
              Response (Success)
            </strong>
            <pre style={{
              background: '#1f2937',
              color: '#e5e7eb',
              padding: '1.25rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.8125rem',
              lineHeight: '1.6',
              border: '1px solid #374151',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {response}
            </pre>
          </div>

          {/* Response Examples for Different Status Codes */}
          {responseExamples && (
            <div style={{ marginTop: '1.5rem' }}>
              <strong style={{
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: '600',
                display: 'block',
                marginBottom: '1rem'
              }}>
                Response Examples
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {responseExamples.map((ex: any, idx: number) => (
                  <div key={idx} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: ex.status < 300 ? '#f0fdf4' : ex.status < 400 ? '#fef3c7' : ex.status < 500 ? '#fee2e2' : '#fef2f2',
                      borderBottom: `1px solid ${ex.status < 300 ? '#bbf7d0' : ex.status < 400 ? '#fde68a' : ex.status < 500 ? '#fecaca' : '#fecaca'}`
                    }}>
                      {ex.status < 300 ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : ex.status < 400 ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      ) : ex.status < 500 ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      )}
                      <span style={{
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: ex.status < 300 ? '#166534' : ex.status < 400 ? '#92400e' : '#991b1b'
                      }}>
                        {ex.status} {ex.label}
                      </span>
                    </div>
                    <pre style={{
                      background: '#f9fafb',
                      color: '#374151',
                      padding: '1rem',
                      margin: 0,
                      fontSize: '0.8125rem',
                      lineHeight: '1.6',
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
      )}

      {/* Try It Section */}
      {showTryIt && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Interactive Testing
            </h4>
            {responseTime !== null && (
              <div style={{
                padding: '0.375rem 0.75rem',
                background: '#f8fafc',
                color: '#64748b',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: '500',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {responseTime}ms
              </div>
            )}
          </div>

          {/* API Key Input */}
          {requiresAuth && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                API Key <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_test_..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    paddingRight: '120px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'Monaco, Consolas, monospace',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    color: '#1e293b'
                  }}
                />
                <button
                  onClick={() => setApiKey('sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.375rem 0.75rem',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Use test key
                </button>
              </div>
            </div>
          )}

          {/* Query Parameters for GET */}
          {method === 'GET' && path !== '/api/health' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                Query Parameters (Optional)
              </label>
              <input
                type="text"
                value={queryParams}
                onChange={(e) => setQueryParams(e.target.value)}
                placeholder="e.g., type=monthly"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'Monaco, Consolas, monospace',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  color: '#1e293b'
                }}
              />
            </div>
          )}

          {/* Request Body for POST */}
          {method === 'POST' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                Request Body (JSON)
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontFamily: 'Monaco, Consolas, monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  color: '#1e293b'
                }}
              />
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={sendRequest}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#cbd5e1' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Sending Request...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                Send Request
              </>
            )}
          </button>

          {/* Response Display */}
          {apiResponse && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '0.75rem'
              }}>
                Response:
              </div>

              {!apiResponse.error && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: apiResponse.status < 300 ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${apiResponse.status < 300 ? '#a7f3d0' : '#fecaca'}`,
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: apiResponse.status < 300 ? '#065f46' : '#991b1b'
                    }}>
                      {apiResponse.status} {apiResponse.statusText}
                    </span>
                  </div>
                </div>
              )}

              <pre style={{
                background: '#f8fafc',
                color: apiResponse.error 
                  ? '#dc2626' 
                  : apiResponse.status === 401 
                    ? '#ea580c' 
                    : '#059669',
                padding: '1rem',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '0.8125rem',
                lineHeight: '1.6',
                border: `1px solid ${
                  apiResponse.error 
                    ? '#fecaca' 
                    : apiResponse.status === 401 
                      ? '#fed7aa' 
                      : '#d1fae5'
                }`,
                fontFamily: 'Monaco, Consolas, monospace',
                maxHeight: '300px',
                margin: 0
              }}>
                {apiResponse.error 
                  ? `Error: ${apiResponse.message}`
                  : JSON.stringify(apiResponse.data, null, 2)
                }
              </pre>
              
              {apiResponse.status === 401 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: '#9a3412',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.5rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div>
                    <strong>Authentication Required:</strong> This endpoint requires a valid API key. 
                    Click "Use test key" button above to populate a test API key.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
