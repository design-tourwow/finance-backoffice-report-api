'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#1a1a1a' }}>
            💼 Finance Backoffice Report API
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            API Documentation & Status Dashboard
          </p>
        </div>

        {/* Status Card */}
        <div style={{
          background: healthStatus?.status === 'ok' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${healthStatus?.status === 'ok' ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {loading ? '⏳' : healthStatus?.status === 'ok' ? '✅' : '❌'}
            </span>
            <div>
              <strong style={{ color: '#1a1a1a' }}>
                {loading ? 'Checking...' : healthStatus?.status === 'ok' ? 'API is Online' : 'API is Offline'}
              </strong>
              {healthStatus && (
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                  Last checked: {new Date(healthStatus.timestamp).toLocaleString('th-TH')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1a1a1a' }}>
            📡 Available Endpoints
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Health Check */}
            <EndpointCard
              method="GET"
              path="/api/health"
              description="ตรวจสอบสถานะของ API server"
              example="curl https://your-api.vercel.app/api/health"
              response={`{
  "status": "ok",
  "timestamp": "2026-01-06T...",
  "service": "finance-backoffice-report-api"
}`}
            />

            {/* Get Reports */}
            <EndpointCard
              method="GET"
              path="/api/reports"
              description="ดึงรายการ reports ทั้งหมด (รองรับ filter ด้วย query parameter ?type=monthly)"
              example="curl https://your-api.vercel.app/api/reports?type=monthly"
              response={`{
  "success": true,
  "data": [...],
  "total": 2
}`}
            />

            {/* Create Report */}
            <EndpointCard
              method="POST"
              path="/api/reports"
              description="สร้าง report ใหม่"
              example={`curl -X POST https://your-api.vercel.app/api/reports \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Monthly Report","type":"monthly"}'`}
              response={`{
  "success": true,
  "data": { "id": "3", ... }
}`}
            />
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1a1a1a' }}>
            🔧 Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <FeatureCard icon="🔒" title="CORS Enabled" description="รองรับการเรียกใช้จาก frontend" />
            <FeatureCard icon="⚡" title="Fast Response" description="Built with Next.js 14" />
            <FeatureCard icon="📊" title="RESTful API" description="Standard REST architecture" />
            <FeatureCard icon="🚀" title="Auto Deploy" description="Deploy อัตโนมัติผ่าน Vercel" />
          </div>
        </div>

        {/* Environment Info */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1rem',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <strong>Environment:</strong> {process.env.NODE_ENV || 'production'} | 
          <strong> Version:</strong> 1.0.0 | 
          <strong> Framework:</strong> Next.js 14
        </div>
      </div>
    </main>
  )
}

function EndpointCard({ method, path, description, example, response }: any) {
  const [showExample, setShowExample] = useState(false)
  
  const methodColors: any = {
    GET: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
    POST: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
    PUT: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
    DELETE: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
  }
  
  const colors = methodColors[method] || methodColors.GET

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1rem',
      background: '#fafafa'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <span style={{
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}>
          {method}
        </span>
        <code style={{ fontSize: '1rem', color: '#333' }}>{path}</code>
      </div>
      <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.875rem' }}>
        {description}
      </p>
      <button
        onClick={() => setShowExample(!showExample)}
        style={{
          background: '#667eea',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}
      >
        {showExample ? '🔼 Hide Example' : '🔽 Show Example'}
      </button>
      
      {showExample && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ fontSize: '0.875rem', color: '#333' }}>Request:</strong>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.8rem',
              marginTop: '0.5rem'
            }}>
              {example}
            </pre>
          </div>
          <div>
            <strong style={{ fontSize: '0.875rem', color: '#333' }}>Response:</strong>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.8rem',
              marginTop: '0.5rem'
            }}>
              {response}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1a1a1a' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{description}</p>
    </div>
  )
}
