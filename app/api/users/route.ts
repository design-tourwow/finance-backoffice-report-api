import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { logApiRequest, checkRateLimit } from '@/lib/logger'

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
  const apiKey = request.headers.get('x-api-key') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  // Rate limiting
  const rateLimit = checkRateLimit(apiKey || clientIp, 100, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('GET', '/api/users', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  if (!checkApiKey(request)) {
    logApiRequest('GET', '/api/users', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  if (!supabase) {
    logApiRequest('GET', '/api/users', 503, apiKey, 'Supabase not configured')
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
      logApiRequest('GET', '/api/users', 400, apiKey, 'Limit exceeds 1000')
      return NextResponse.json(
        { success: false, error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    // Validation: sort_by allowed fields
    const allowedSortFields = ['id', 'user_id', 'name', 'created_at', 'updated_at', 'last_interaction', 'subscribed']
    if (!allowedSortFields.includes(sortBy)) {
      logApiRequest('GET', '/api/users', 400, apiKey, 'Invalid sort_by field')
      return NextResponse.json(
        { success: false, error: `Invalid sort_by field. Allowed: ${allowedSortFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validation: sort_order
    if (!['asc', 'desc'].includes(sortOrder)) {
      logApiRequest('GET', '/api/users', 400, apiKey, 'Invalid sort_order')
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
      logApiRequest('GET', '/api/users', 500, apiKey, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    logApiRequest('GET', '/api/users', 200, apiKey)
    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total: count || 0,
          limit,
          offset,
          returned: data?.length || 0
        }
      },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    )
  } catch (error: any) {
    logApiRequest('GET', '/api/users', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('POST', '/api/users', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  if (!supabase) {
    logApiRequest('POST', '/api/users', 503, apiKey, 'Supabase not configured')
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    // Validation: user_id is required
    if (!body.user_id) {
      logApiRequest('POST', '/api/users', 400, apiKey, 'user_id missing')
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Validation: user_id format (if LINE)
    if (body.user_ns === 'line' && body.user_id && !body.user_id.startsWith('U')) {
      logApiRequest('POST', '/api/users', 400, apiKey, 'Invalid LINE user_id format')
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
      logApiRequest('POST', '/api/users', 400, apiKey, 'Invalid subscribed timestamp')
      return NextResponse.json(
        { success: false, error: 'Invalid subscribed timestamp format' },
        { status: 400 }
      )
    }

    if (body.last_interaction && isNaN(Date.parse(body.last_interaction))) {
      logApiRequest('POST', '/api/users', 400, apiKey, 'Invalid last_interaction timestamp')
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
        logApiRequest('POST', '/api/users', 409, apiKey, 'Duplicate user_id')
        return NextResponse.json(
          { success: false, error: 'User with this user_id already exists' },
          { status: 409 }
        )
      }
      logApiRequest('POST', '/api/users', 500, apiKey, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    logApiRequest('POST', '/api/users', 201, apiKey)
    return NextResponse.json({
      success: true,
      data: data?.[0]
    }, { status: 201 })
  } catch (error: any) {
    logApiRequest('POST', '/api/users', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/users - Update a user
export async function PUT(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  
  if (!checkApiKey(request)) {
    logApiRequest('PUT', '/api/users', 401, apiKey, 'Invalid API key')
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    )
  }

  if (!supabase) {
    logApiRequest('PUT', '/api/users', 503, apiKey, 'Supabase not configured')
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { user_id, ...updateData } = body

    if (!user_id) {
      logApiRequest('PUT', '/api/users', 400, apiKey, 'user_id missing')
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
      logApiRequest('PUT', '/api/users', 500, apiKey, error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      logApiRequest('PUT', '/api/users', 404, apiKey, 'User not found')
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    logApiRequest('PUT', '/api/users', 200, apiKey)
    return NextResponse.json({
      success: true,
      data: data?.[0]
    })
  } catch (error: any) {
    logApiRequest('PUT', '/api/users', 500, apiKey, error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
