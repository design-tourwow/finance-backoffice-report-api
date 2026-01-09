import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

// Middleware to check API key
function checkApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const validKeys = [
    process.env.API_KEY_1,
    process.env.API_KEY_2
  ].filter(Boolean)

  if (process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey) return false
    return validKeys.includes(apiKey)
  }
  return true
}

// GET /api/users - Get all users or filter by user_id
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userNs = searchParams.get('user_ns')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase.from('users').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (userNs) {
      query = query.eq('user_ns', userNs)
    }

    query = query.limit(limit).order('id', { ascending: true })

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    // Ensure chat_history is an array
    if (body.chat_history && !Array.isArray(body.chat_history)) {
      body.chat_history = []
    }

    const { data, error } = await supabase
      .from('users')
      .insert([body])
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data?.[0]
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/users - Update a user
export async function PUT(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { user_id, ...updateData } = body

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user_id)
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data?.[0]
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
