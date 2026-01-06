import { NextRequest } from 'next/server'

// API Keys - ในการใช้งานจริงควรเก็บใน Database
const VALID_API_KEYS = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  // เพิ่ม API keys ได้ตามต้องการ
])

export function validateApiKey(request: NextRequest): boolean {
  // ถ้าไม่ได้ตั้งค่า API keys ให้เปิดใช้งานได้เลย (สำหรับ development)
  if (process.env.REQUIRE_API_KEY !== 'true') {
    return true
  }

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
