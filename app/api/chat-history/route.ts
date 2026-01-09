import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

function checkApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const validKeys = [process.env.API_KEY_1, process.env.API_KEY_2].filter(Boolean)
  if (process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey) return false
    return validKeys.includes(apiKey)
  }
  return true
}

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })
    }
    const { data, error } = await supabase.from('users').select('chat_history, user_id, name').eq('user_id', userId).single()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      user_id: data?.user_id,
      name: data?.name,
      chat_history: data?.chat_history || [],
      total: Array.isArray(data?.chat_history) ? data.chat_history.length : 0
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { user_id, message } = body
    if (!user_id || !message) {
      return NextResponse.json({ success: false, error: 'user_id and message required' }, { status: 400 })
    }
    const { data: userData, error: fetchError } = await supabase.from('users').select('chat_history').eq('user_id', user_id).single()
    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }
    const currentHistory = Array.isArray(userData?.chat_history) ? userData.chat_history : []
    const updatedHistory = [...currentHistory, message]
    const { data, error } = await supabase.from('users').update({ chat_history: updatedHistory, last_interaction: new Date().toISOString() }).eq('user_id', user_id).select()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: data?.[0] }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })
    }
    const { error } = await supabase.from('users').update({ chat_history: [] }).eq('user_id', userId)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: 'Chat history cleared' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
