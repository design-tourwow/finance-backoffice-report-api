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
    const name = searchParams.get('name')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort_by') || 'id'
    const sortOrder = searchParams.get('sort_order') || 'asc'

    // Validation: limit max 1000
    if (limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    // Validation: sort_by allowed fields
    const allowedSortFields = ['id', 'user_id', 'name', 'created_at', 'updated_at', 'last_interaction', 'subscribed']
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: `Invalid sort_by field. Allowed: ${allowedSortFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validation: sort_order
    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sort_order. Use: asc or desc' },
        { status: 400 }
      )
    }

    let query = supabase.from('users').select('*', { count: 'exact' })

    // Filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (userNs) {
      query = query.eq('user_ns', userNs)
    }

    if (name) {
      query = query.ilike('name', `%${name}%`)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        returned: data?.length || 0
      }
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

    // Validation: user_id is required
    if (!body.user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Validation: user_id format (if LINE)
    if (body.user_ns === 'line' && body.user_id && !body.user_id.startsWith('U')) {
      return NextResponse.json(
        { success: false, error: 'Invalid LINE user_id format (must start with U)' },
        { status: 400 }
      )
    }

    // Ensure chat_history is an array
    if (body.chat_history && !Array.isArray(body.chat_history)) {
      body.chat_history = []
    }

    // Validation: timestamp formats
    if (body.subscribed && isNaN(Date.parse(body.subscribed))) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscribed timestamp format' },
        { status: 400 }
      )
    }

    if (body.last_interaction && isNaN(Date.parse(body.last_interaction))) {
      return NextResponse.json(
        { success: false, error: 'Invalid last_interaction timestamp format' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .insert([body])
      .select()

    if (error) {
      // Handle duplicate key error
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'User with this user_id already exists' },
          { status: 409 }
        )
      }
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
