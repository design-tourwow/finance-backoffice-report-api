import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import type { Browser } from 'puppeteer-core'
import { authenticate } from '@/lib/auth'
import { checkRateLimit, logApiRequest } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const LOCAL_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean) as string[]

async function getExecutablePath() {
  if (process.env.VERCEL) {
    return chromium.executablePath()
  }

  for (const candidate of LOCAL_CHROME_PATHS) {
    if (candidate) return candidate
  }

  return chromium.executablePath()
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization') || ''
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const rateLimit = checkRateLimit(apiKey || clientIp, 20, 60000)
  if (!rateLimit.allowed) {
    logApiRequest('POST', '/api/reports/commission-plus/pdf', 429, apiKey, 'Rate limit exceeded')
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
  }

  const auth = authenticate(request)
  if (!auth.authenticated) {
    logApiRequest('POST', '/api/reports/commission-plus/pdf', 401, apiKey, 'Unauthorized')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let browser: Browser | null = null

  try {
    const body = await request.json()
    const html = typeof body?.html === 'string' ? body.html : ''
    const rawFileName = typeof body?.fileName === 'string' ? body.fileName : 'commission-report-plus.pdf'

    if (!html.trim()) {
      return NextResponse.json({ success: false, error: 'html is required' }, { status: 400 })
    }

    if (html.length > 2_000_000) {
      return NextResponse.json({ success: false, error: 'html payload too large' }, { status: 413 })
    }

    const executablePath = await getExecutablePath()
    browser = await puppeteer.launch({
      args: process.env.VERCEL ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1440, height: 1024, deviceScaleFactor: 1 },
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    })

    await page.close()
    await browser.close()
    browser = null

    const safeFileName = rawFileName.replace(/[^a-zA-Z0-9._-]+/g, '-')

    const pdfBuffer = Buffer.from(pdf)

    logApiRequest('POST', '/api/reports/commission-plus/pdf', 200, apiKey)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName || 'commission-report-plus.pdf'}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => {})
    }
    logApiRequest('POST', '/api/reports/commission-plus/pdf', 500, apiKey, error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
