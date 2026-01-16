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
    const curlWithKey = endpoint.curl.replace('YOUR_API_KEY', 'sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d')
    navigator.clipboard.writeText(curlWithKey)
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
        {/* Test API Key - Sticky at top */}
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
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                Test API Key
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d')
                const btn = document.activeElement as HTMLButtonElement
                btn.style.color = '#10b981'
                setTimeout(() => btn.style.color = '#9ca3af', 2000)
              }}
              style={{
                background: 'transparent',
                color: '#9ca3af',
                border: 'none',
                padding: '0.375rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all 0.2s'
              }}
              title="Copy API Key"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
          <div style={{
            padding: '0.75rem 1rem',
            background: '#1f2937'
          }}>
            <code style={{
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '0.8125rem',
              color: '#e5e7eb',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d
            </code>
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
                title={copiedWithKey ? 'Copied with API Key!' : 'Copy with Test API Key'}
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
      id: 'INFO-date-formats',
      method: 'INFO',
      path: '📅 Date Format Standards',
      description: 'รูปแบบวันที่ที่รองรับในระบบ - ใช้ query parameter "date_format" ใน API endpoints',
      category: '📚 Documentation',
      requiresAuth: false,
      parameters: [
        { name: 'date_format', type: 'string', description: 'รูปแบบวันที่ (8 แบบ) - ใช้กับ /api/reports/by-travel-date และ /api/reports/by-booking-date' }
      ],
      curl: `# ตัวอย่างการใช้งาน Date Format

# 1. Default (เดือนไทยเต็ม + ปี พ.ศ. เต็ม)
curl "${apiUrl}/api/reports/by-travel-date" \\
  -H "x-api-key: YOUR_API_KEY"
# Result: "มกราคม 2568"

# 2. เดือนไทยย่อ + ปี พ.ศ. ย่อ (สำหรับ Chart)
curl "${apiUrl}/api/reports/by-travel-date?date_format=th_short_be_short" \\
  -H "x-api-key: YOUR_API_KEY"
# Result: "ม.ค. 68"

# 3. เดือนอังกฤษเต็ม + ปี พ.ศ. เต็ม
curl "${apiUrl}/api/reports/by-travel-date?date_format=en_full_be_full" \\
  -H "x-api-key: YOUR_API_KEY"
# Result: "January 2568"

# 4. เดือนอังกฤษย่อ + ปี ค.ศ. ย่อ
curl "${apiUrl}/api/reports/by-travel-date?date_format=en_short_ad_short" \\
  -H "x-api-key: YOUR_API_KEY"
# Result: "Jan 25"`,
      response: `{
  "📋 รูปแบบทั้งหมด (8 แบบ)": {
    "th_full_be_full": {
      "example": "มกราคม 2568",
      "description": "เดือนไทยเต็ม + ปี พ.ศ. เต็ม",
      "use_case": "Default - Table display",
      "is_default": true
    },
    "th_short_be_short": {
      "example": "ม.ค. 68",
      "description": "เดือนไทยย่อ + ปี พ.ศ. ย่อ",
      "use_case": "Chart labels (many data)"
    },
    "th_full_ad_full": {
      "example": "มกราคม 2025",
      "description": "เดือนไทยเต็ม + ปี ค.ศ. เต็ม",
      "use_case": "ถ้าต้องการ ค.ศ."
    },
    "th_short_ad_short": {
      "example": "ม.ค. 25",
      "description": "เดือนไทยย่อ + ปี ค.ศ. ย่อ",
      "use_case": "Chart + ค.ศ."
    },
    "en_full_be_full": {
      "example": "January 2568",
      "description": "เดือนอังกฤษเต็ม + ปี พ.ศ. เต็ม",
      "use_case": "International + พ.ศ."
    },
    "en_short_be_short": {
      "example": "Jan 68",
      "description": "เดือนอังกฤษย่อ + ปี พ.ศ. ย่อ",
      "use_case": "International chart"
    },
    "en_full_ad_full": {
      "example": "January 2025",
      "description": "เดือนอังกฤษเต็ม + ปี ค.ศ. เต็ม",
      "use_case": "International + ค.ศ."
    },
    "en_short_ad_short": {
      "example": "Jan 25",
      "description": "เดือนอังกฤษย่อ + ปี ค.ศ. ย่อ",
      "use_case": "International chart + ค.ศ."
    }
  },
  "🎯 API Endpoints ที่รองรับ": [
    "/api/reports/by-travel-date",
    "/api/reports/by-booking-date"
  ],
  "💡 แนะนำการใช้งาน": {
    "table_display": "th_full_be_full → มกราคม 2568",
    "chart_labels": "th_short_be_short → ม.ค. 68",
    "international": "en_full_be_full → January 2568"
  },
  "⚠️ หมายเหตุ": [
    "ถ้าไม่ส่ง date_format → ใช้ th_full_be_full (มกราคม 2568)",
    "ถ้าส่ง format ผิด → fallback ไปใช้ th_full_be_full",
    "รองรับเฉพาะ 8 รูปแบบที่กำหนดไว้"
  ],
  "📚 เอกสารเพิ่มเติม": {
    "full_guide": "DATE_FORMAT_GUIDE.md",
    "quick_reference": "DATE_FORMAT_QUICK_REFERENCE.md",
    "utility_code": "lib/dateFormatter.ts"
  }
}`,
      responses: [
        { status: 200, description: 'Information only - not an actual endpoint' }
      ]
    },
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
      id: 'GET-/api/customers',
      method: 'GET',
      path: '/api/customers',
      description: 'Retrieve customer records from MySQL database (Xqc7k7_customers table)',
      category: 'MySQL - Customers',
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
      category: 'MySQL - Customers',
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
      category: 'MySQL - Customers',
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
      category: 'MySQL - Customers',
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
      category: 'MySQL - Orders',
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
      category: 'MySQL - Orders',
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
      category: 'MySQL - Orders',
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
      category: 'MySQL - Orders',
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
      id: 'GET-/api/installments',
      method: 'GET',
      path: '/api/installments',
      description: 'Retrieve customer order installment records from MySQL database (Xqc7k7_customer_order_installments table)',
      category: 'MySQL - Installments',
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
      category: 'MySQL - Installments',
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
      category: 'MySQL - Installments',
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
      category: 'MySQL - Installments',
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
      id: 'GET-/api/suppliers',
      method: 'GET',
      path: '/api/suppliers',
      description: 'Retrieve supplier records from MySQL database (tw_suppliers_db.GsF2WeS_suppliers table)',
      category: 'MySQL - Suppliers',
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
      category: 'MySQL - Suppliers',
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
      category: 'MySQL - Suppliers',
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
      category: 'MySQL - Suppliers',
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
    },
    {
      id: 'GET-/api/reports/lead-time-analysis',
      method: 'GET',
      path: '/api/reports/lead-time-analysis',
      description: 'Analyze booking lead time (days between booking date and travel date) with statistics and distribution',
      category: 'MySQL - Reports',
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


