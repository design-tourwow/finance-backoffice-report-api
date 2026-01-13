import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Get credentials from environment
    const validUsername = process.env.DOCS_USERNAME
    const validPassword = process.env.DOCS_PASSWORD

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 503 }
      )
    }

    // Validate credentials
    if (username === validUsername && password === validPassword) {
      // Create session token (simple approach)
      const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64')
      
      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set('docs_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
