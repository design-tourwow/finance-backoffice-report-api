import { NextRequest } from 'next/server'

// API Keys - ในการใช้งานจริงควรเก็บใน Database
// Test keys for demonstration
const VALID_API_KEYS = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  'sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e', // Test key 1
  'sk_test_9a7b5c3d1e2f4a6b8c0d2e4f6a8b0c2d', // Test key 2
])

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!apiKey) {
    return false
  }

  return VALID_API_KEYS.has(apiKey)
}

export function unauthorizedResponse() {
  return Response.json(
    {
      success: false,
      error: 'Unauthorized',
      message: 'Valid API key is required. Please include x-api-key header.'
    },
    { status: 401 }
  )
}
