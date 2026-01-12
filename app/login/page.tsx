'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationError('')

    // Client-side validation
    const usernameEmpty = !username.trim()
    const passwordEmpty = !password.trim()

    if (usernameEmpty && passwordEmpty) {
      setValidationError('Please enter your username and password')
      return
    } else if (usernameEmpty) {
      setValidationError('Please enter your username')
      return
    } else if (passwordEmpty) {
      setValidationError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        padding: '3rem',
        width: '100%',
        maxWidth: '420px',
        margin: '1rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#1f2937',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h1 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827'
          }}>
            API Documentation
          </h1>
          <p style={{
            margin: 0,
            fontSize: '0.9375rem',
            color: '#6b7280'
          }}>
            Sign in to access the documentation
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (validationError) {
                  setValidationError('')
                }
              }}
              autoComplete="username"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                border: `2px solid ${validationError ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!validationError) {
                  e.currentTarget.style.borderColor = '#1f2937'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 41, 55, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!validationError) {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (validationError) {
                  setValidationError('')
                }
              }}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                border: `2px solid ${validationError ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!validationError) {
                  e.currentTarget.style.borderColor = '#1f2937'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31, 41, 55, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!validationError) {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {validationError && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#991b1b'
            }}>
              {validationError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#9ca3af' : '#1f2937',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 1px 3px rgba(31, 41, 55, 0.3)',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#111827'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#1f2937'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(31, 41, 55, 0.3)'
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: '#9ca3af'
        }}>
          Finance Backoffice Report API
        </div>
      </div>
    </div>
  )
}
