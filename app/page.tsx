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
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Header with Glassmorphism */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}>
              💼
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '2.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Finance Backoffice Report API
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '1.1rem' }}>
                Modern RESTful API Documentation & Dashboard
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: healthStatus?.status === 'ok' 
              ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
              : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            animation: loading ? 'pulse 2s infinite' : 'none'
          }}>
            <span style={{ fontSize: '1.25rem' }}>
              {loading ? '⏳' : healthStatus?.status === 'ok' ? '✅' : '❌'}
            </span>
            <span>
              {loading ? 'Checking Status...' : healthStatus?.status === 'ok' ? 'API Online' : 'API Offline'}
            </span>
          </div>
          
          {healthStatus && (
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.9rem', 
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🕐</span>
              <span>Last checked: {new Date(healthStatus.timestamp).toLocaleString('th-TH')}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <StatCard icon="📡" label="Endpoints" value="3" color="#667eea" />
          <StatCard icon="⚡" label="Avg Response" value="<100ms" color="#38ef7d" />
          <StatCard icon="🔒" label="Security" value="API Key" color="#f093fb" />
          <StatCard icon="🌍" label="Region" value="Singapore" color="#4facfe" />
        </div>

        {/* API Endpoints */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          <h2 style={{ 
            fontSize: '1.75rem', 
            marginBottom: '1.5rem', 
            color: '#1a1a1a',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📡</span> API Endpoints
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <EndpointCard
              method="GET"
              path="/api/health"
              description="ตรวจสอบสถานะของ API server และ uptime"
              example="curl https://your-api.vercel.app/api/health"
              response={`{
  "status": "ok",
  "timestamp": "2026-01-06T...",
  "service": "finance-backoffice-report-api"
}`}
            />

            <EndpointCard
              method="GET"
              path="/api/reports"
              description="ดึงรายการ reports ทั้งหมด พร้อม filter ตาม type"
              example="curl https://your-api.vercel.app/api/reports?type=monthly"
              response={`{
  "success": true,
  "data": [...],
  "total": 2
}`}
            />

            <EndpointCard
              method="POST"
              path="/api/reports"
              description="สร้าง report ใหม่ในระบบ"
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
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          <h2 style={{ 
            fontSize: '1.75rem', 
            marginBottom: '1.5rem', 
            color: '#1a1a1a',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✨</span> Features
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.25rem' 
          }}>
            <FeatureCard 
              icon="🔒" 
              title="API Key Auth" 
              description="ระบบ authentication ด้วย API Key"
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
            <FeatureCard 
              icon="⚡" 
              title="Lightning Fast" 
              description="Response time < 100ms"
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            />
            <FeatureCard 
              icon="📊" 
              title="RESTful API" 
              description="Standard REST architecture"
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            />
            <FeatureCard 
              icon="🚀" 
              title="Auto Deploy" 
              description="CI/CD ผ่าน Vercel & GitHub"
              gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            />
            <FeatureCard 
              icon="🌐" 
              title="CORS Ready" 
              description="รองรับ cross-origin requests"
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            />
            <FeatureCard 
              icon="📝" 
              title="Full Docs" 
              description="เอกสารครบถ้วน พร้อมตัวอย่าง"
              gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            <strong style={{ color: '#1a1a1a' }}>Environment:</strong> {process.env.NODE_ENV || 'production'} • 
            <strong style={{ color: '#1a1a1a' }}> Version:</strong> 1.0.0 • 
            <strong style={{ color: '#1a1a1a' }}> Framework:</strong> Next.js 14
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Built with ❤️ by Design Tourwow Team
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </main>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: color }}>{value}</div>
    </div>
  )
}

function EndpointCard({ method, path, description, example, response }: any) {
  const [showExample, setShowExample] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const methodColors: any = {
    GET: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
    POST: { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: '#fff' },
    PUT: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#fff' },
    DELETE: { bg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', text: '#fff' }
  }
  
  const colors = methodColors[method] || methodColors.GET

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '1.5rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{
          background: colors.bg,
          color: colors.text,
          padding: '0.4rem 1rem',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '0.875rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          letterSpacing: '0.5px'
        }}>
          {method}
        </span>
        <code style={{ 
          fontSize: '1.05rem', 
          color: '#333',
          fontWeight: '600',
          fontFamily: 'Monaco, Consolas, monospace'
        }}>
          {path}
        </code>
      </div>
      <p style={{ margin: '0.75rem 0', color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
        {description}
      </p>
      <button
        onClick={() => setShowExample(!showExample)}
        style={{
          background: showExample 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          border: 'none',
          padding: '0.65rem 1.25rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
          marginTop: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s'
        }}
      >
        {showExample ? '🔼 Hide Example' : '🔽 Show Example'}
      </button>
      
      {showExample && (
        <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.3s' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <strong style={{ fontSize: '0.9rem', color: '#333' }}>📤 Request:</strong>
              <button
                onClick={() => copyToClipboard(example)}
                style={{
                  background: copied ? '#38ef7d' : '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1.25rem',
              borderRadius: '12px',
              overflow: 'auto',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {example}
            </pre>
          </div>
          <div>
            <strong style={{ fontSize: '0.9rem', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
              📥 Response:
            </strong>
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1.25rem',
              borderRadius: '12px',
              overflow: 'auto',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {response}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description, gradient }: any) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '1.75rem',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        margin: '0 auto 1rem',
        background: gradient,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.75rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        {icon}
      </div>
      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        fontSize: '1.1rem', 
        color: '#1a1a1a',
        fontWeight: '700'
      }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
        {description}
      </p>
    </div>
  )
}
