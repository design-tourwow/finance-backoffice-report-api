import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('docs_session')
    
    if (session?.value) {
      return NextResponse.json({ authenticated: true })
    }
    
    return NextResponse.json({ authenticated: false })
  } catch (error: any) {
    return NextResponse.json({ authenticated: false })
  }
}
