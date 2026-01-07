'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Playground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/health')
  const [method, setMethod] = useState('GET')
  const [apiKey, setApiKey] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [queryParams, setQueryParams] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [showApiKeyHint, setShowApiKeyHint] = useState(false)

  const endpoints = [
    { path: '/api/health', method: 'GET', description: 'Health check' },
    { path: '/api/reports', method: 'GET', description: 'Get all reports' },
    { path: '/api/reports', method: 'POST', description: 'Create report' }
  ]

  const exampleBodies: any = {
    'POST:/api/reports': JSON.stringify({
      title: 'Monthly Financial Report',
      type: 'monthly'
    }, null, 2)
  }

  const handleEndpointChange = (path: string, m: string) => {
    setSelectedEndpoint(path)
    setMethod(m)
    setResponse(null)
    setResponseTime(null)
    
    const key = `${m}:${path}`
    if (exampleBodies[key]) {
      setRequestBody(exampleBodies[key])
    } else {
      setRequestBody('')
    }
  }

  const sendRequest = async () => {
    setLoading(true)
    setResponse(null)
    setResponseTime(null)

    try {
      const startTime = performance.now()
      
      let url = selectedEndpoint
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
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data
      })
      setResponseTime(Math.round(endTime - startTime))
    } catch (error: any) {
      setResponse({
        error: true,
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Navigation */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  API Playground
                </div>
              </div>
            </Link>
          </div>
          <Link 
            href="/"
            style={{
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: '1px solid #d1d5db'
            }}
          >
            ← Back to Docs
          </Link>
        </div>
      </nav>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#111827'
          }}>
            🧪 API Testing Playground
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Test API endpoints directly from your browser
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem'
        }}>
          {/* Left Panel - Request */}
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                Request Configuration
              </h2>

              {/* Endpoint Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Select Endpoint
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {endpoints.map((ep) => (
                    <button
                      key={`${ep.method}:${ep.path}`}
                      onClick={() => handleEndpointChange(ep.path, ep.method)}
                      style={{
                        padding: '0.75rem 1rem',
                        background: selectedEndpoint === ep.path && method === ep.method ? '#eff6ff' : '#f9fafb',
                        border: `1px solid ${selectedEndpoint === ep.path && method === ep.method ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: ep.method === 'GET' ? '#dbeafe' : '#d1fae5',
                          color: ep.method === 'GET' ? '#1e40af' : '#065f46',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {ep.method}
                        </span>
                        <code style={{ fontSize: '0.875rem', color: '#111827' }}>{ep.path}</code>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '3.5rem' }}>
                        {ep.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    API Key {selectedEndpoint !== '/api/health' && '(Required)'}
                  </label>
                  <button
                    onClick={() => setShowApiKeyHint(!showApiKeyHint)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {showApiKeyHint ? 'Hide' : 'Show'} test key
                  </button>
                </div>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_test_..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'Monaco, Consolas, monospace',
                    boxSizing: 'border-box'
                  }}
                />
                {showApiKeyHint && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: '#eff6ff',
                    border: '1px solid #dbeafe',
                    borderRadius: '6px',
                    fontSize: '0.8125rem'
                  }}>
                    <div style={{ color: '#1e40af', fontWeight: '500', marginBottom: '0.5rem' }}>
                      💡 Test API Keys:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ 
                          flex: 1, 
                          background: '#ffffff', 
                          padding: '0.375rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#374151'
                        }}>
                          sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e
                        </code>
                        <button
                          onClick={() => setApiKey('sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e')}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Use
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        ⚠️ For testing only. Do not use in production.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Query Parameters */}
              {method === 'GET' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Query Parameters
                  </label>
                  <input
                    type="text"
                    value={queryParams}
                    onChange={(e) => setQueryParams(e.target.value)}
                    placeholder="e.g., type=monthly"
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontFamily: 'Monaco, Consolas, monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Request Body */}
              {method !== 'GET' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontFamily: 'Monaco, Consolas, monospace',
                      resize: 'vertical',
                      boxSizing: 'border-box'
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
                  background: loading ? '#9ca3af' : '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {loading ? '⏳ Sending Request...' : '🚀 Send Request'}
              </button>
            </div>
          </div>

          {/* Right Panel - Response */}
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              minHeight: '600px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Response
                </h2>
                {responseTime !== null && (
                  <div style={{
                    padding: '0.375rem 0.75rem',
                    background: '#ecfdf5',
                    color: '#065f46',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    border: '1px solid #d1fae5'
                  }}>
                    ⚡ {responseTime}ms
                  </div>
                )}
              </div>

              {!response && !loading && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '400px',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                    No response yet
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center', maxWidth: '300px' }}>
                    Configure and send a request to see the response
                  </div>
                  
                  {/* Example Responses */}
                  <div style={{
                    marginTop: '2rem',
                    width: '100%',
                    maxWidth: '500px',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '1rem'
                    }}>
                      💡 Example Responses:
                    </div>
                    
                    {/* Success Response */}
                    <details style={{ marginBottom: '0.75rem' }}>
                      <summary style={{
                        padding: '0.75rem',
                        background: '#ecfdf5',
                        border: '1px solid #d1fae5',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        color: '#065f46'
                      }}>
                        ✅ With Valid API Key
                      </summary>
                      <pre style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#1f2937',
                        color: '#10b981',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        overflow: 'auto'
                      }}>{`{
  "success": true,
  "data": [...],
  "total": 2
}`}</pre>
                    </details>

                    {/* No API Key */}
                    <details style={{ marginBottom: '0.75rem' }}>
                      <summary style={{
                        padding: '0.75rem',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        color: '#92400e'
                      }}>
                        ⚠️ Without API Key
                      </summary>
                      <pre style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#1f2937',
                        color: '#fbbf24',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        overflow: 'auto'
                      }}>{`{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid API key is required. Please include x-api-key header."
}`}</pre>
                    </details>

                    {/* Invalid API Key */}
                    <details>
                      <summary style={{
                        padding: '0.75rem',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                        color: '#991b1b'
                      }}>
                        ❌ With Invalid API Key
                      </summary>
                      <pre style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#1f2937',
                        color: '#ef4444',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        overflow: 'auto'
                      }}>{`{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid API key is required. Please include x-api-key header."
}`}</pre>
                    </details>
                  </div>
                </div>
              )}

              {loading && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '400px',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                    Sending request...
                  </div>
                </div>
              )}

              {response && !response.error && (
                <div>
                  {/* Status */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Status
                    </div>
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: response.status < 300 ? '#ecfdf5' : '#fee2e2',
                      border: `1px solid ${response.status < 300 ? '#d1fae5' : '#fecaca'}`,
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: response.status < 300 ? '#065f46' : '#991b1b'
                      }}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Response Body */}
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Response Body
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
                      fontFamily: 'Monaco, Consolas, monospace',
                      maxHeight: '400px'
                    }}>
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {response && response.error && (
                <div style={{
                  padding: '1.5rem',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#991b1b',
                    marginBottom: '0.5rem'
                  }}>
                    ❌ Error
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#7f1d1d'
                  }}>
                    {response.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
