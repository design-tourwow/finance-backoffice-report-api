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
              🌐
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
            value="3"
            icon="📊"
            description="Available API routes"
          />
          <MetricCard
            label="Response Time"
            value="< 100ms"
            icon="⚡"
            description="Average latency"
          />
          <MetricCard
            label="Security"
            value="API Key"
            icon="🔐"
            description="Authentication method"
          />
          <MetricCard
            label="Uptime"
            value="99.9%"
            icon="✓"
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
              📡
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
              description="Retrieve all financial reports with optional filtering by type"
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
              description="Create a new financial report in the system"
              example={`curl -X POST https://your-api.vercel.app/api/reports \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{"title":"Monthly Report","type":"monthly"}'`}
              response={`{
  "success": true,
  "data": { "id": "3", ... }
}`}
            />
          </div>
        </div>

        {/* Features Section */}
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
              ⚙️
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              Platform Features
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            <FeatureCard
              icon="🔒"
              title="API Key Authentication"
              description="Secure access control with API key validation and authorization"
            />
            <FeatureCard
              icon="⚡"
              title="High Performance"
              description="Optimized for speed with sub-100ms response times"
            />
            <FeatureCard
              icon="📊"
              title="RESTful Architecture"
              description="Industry-standard REST API design principles"
            />
            <FeatureCard
              icon="🌐"
              title="CORS Support"
              description="Cross-origin resource sharing for web applications"
            />
            <FeatureCard
              icon="🚀"
              title="Continuous Deployment"
              description="Automated CI/CD pipeline via Vercel and GitHub"
            />
            <FeatureCard
              icon="📝"
              title="Complete Documentation"
              description="Comprehensive guides and code examples"
            />
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            flexWrap: 'wrap'
          }}>
            <div>
              <strong style={{ color: '#374151' }}>Environment:</strong> {process.env.NODE_ENV || 'production'}
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Version:</strong> 1.0.0
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Framework:</strong> Next.js 14
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Region:</strong> Singapore (SIN1)
            </div>
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#9ca3af',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            © 2026 Design Tourwow. All rights reserved.
          </div>
        </footer>
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
          fontSize: '1.25rem'
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

function EndpointCard({ method, path, description, example, response }: any) {
  const [showExample, setShowExample] = useState(false)
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

      <button
        onClick={() => setShowExample(!showExample)}
        style={{
          background: showExample ? '#f3f4f6' : '#1e40af',
          color: showExample ? '#374151' : '#ffffff',
          border: showExample ? '1px solid #d1d5db' : 'none',
          padding: '0.625rem 1.25rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        {showExample ? '▲ Hide Example' : '▼ Show Example'}
      </button>

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
                  background: copied ? '#d1fae5' : '#f3f4f6',
                  color: copied ? '#065f46' : '#374151',
                  border: `1px solid ${copied ? '#a7f3d0' : '#d1d5db'}`,
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? '✓ Copied' : '📋 Copy'}
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
              Response
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
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '1.5rem',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        background: '#eff6ff',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '1rem',
        border: '1px solid #dbeafe'
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '1.0625rem',
        color: '#111827',
        fontWeight: '600'
      }}>
        {title}
      </h3>
      <p style={{
        margin: 0,
        fontSize: '0.875rem',
        color: '#6b7280',
        lineHeight: '1.6'
      }}>
        {description}
      </p>
    </div>
  )
}
