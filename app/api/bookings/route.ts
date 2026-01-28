import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET(request: NextRequest) {
  // Authenticate using JWT or API Key
  const auth = authenticate(request)
  if (!auth.authenticated) {
    return Response.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type')
    
    // Query ข้อมูลจาก Database
    let query = 'SELECT * FROM v_Xqc7k7_bookings'
    const params: any[] = []
    
    // ถ้ามีการ filter ตาม type
    if (type) {
      query += ' WHERE type = ?'
      params.push(type)
    }
    
    // LIMIT ต้องใส่โดยตรง ไม่สามารถใช้ prepared statement ได้
    query += ` LIMIT ${limit}`
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params)
    
    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length
    })
  } catch (error: any) {
    console.error('Database query error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database query failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Authenticate using JWT or API Key
  const auth = authenticate(request)
  if (!auth.authenticated) {
    return Response.json(
      { success: false, error: 'Unauthorized - ' + (auth.error || 'Invalid token or API key') },
      { status: 401 }
    )
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
    
    // Insert ข้อมูลลง Database
    const query = `
      INSERT INTO v_Xqc7k7_bookings (title, type, created_at, status) 
      VALUES (?, ?, NOW(), 'pending')
    `
    
    const [result]: any = await pool.execute(query, [body.title, body.type])
    
    // ดึงข้อมูลที่เพิ่งสร้างกลับมา
    const [newRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM v_Xqc7k7_bookings WHERE id = ?',
      [result.insertId]
    )
    
    return NextResponse.json({
      success: true,
      data: newRows[0]
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Database insert error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database insert failed',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
