import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, unauthorizedResponse } from '@/lib/auth'

// Mock data - ในอนาคตจะเชื่อมต่อกับ database
const mockReports = [
  {
    id: '1',
    title: 'Monthly Financial Report',
    type: 'monthly',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'completed'
  },
  {
    id: '2',
    title: 'Quarterly Summary',
    type: 'quarterly',
    createdAt: '2026-01-05T00:00:00Z',
    status: 'pending'
  }
]

export async function GET(request: NextRequest) {
  // ตรวจสอบ API Key (ถ้าเปิดใช้งาน)
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  
  let filteredReports = mockReports
  
  if (type) {
    filteredReports = mockReports.filter(report => report.type === type)
  }
  
  return NextResponse.json({
    success: true,
    data: filteredReports,
    total: filteredReports.length
  })
}

export async function POST(request: NextRequest) {
  // ตรวจสอบ API Key (ถ้าเปิดใช้งาน)
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }
  
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Title and type are required' },
        { status: 400 }
      )
    }
    
    const newReport = {
      id: String(mockReports.length + 1),
      title: body.title,
      type: body.type,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    
    mockReports.push(newReport)
    
    return NextResponse.json({
      success: true,
      data: newReport
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
