import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { submitSitemapToSearchEngines, pingSitemapUpdate } from '@/lib/search-engine-submission'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action = 'submit', sitemapUrl } = body

    let results
    
    if (action === 'ping') {
      results = await pingSitemapUpdate()
    } else {
      results = await submitSitemapToSearchEngines(sitemapUrl)
    }
    
    return NextResponse.json({
      message: `Sitemap ${action} completed`,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit sitemap to search engines' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'
    
    return NextResponse.json({
      sitemapUrl: `${siteUrl}/sitemap.xml`,
      robotsUrl: `${siteUrl}/robots.txt`,
      searchEngines: {
        google: {
          pingUrl: `https://www.google.com/ping?sitemap=${encodeURIComponent(`${siteUrl}/sitemap.xml`)}`,
          searchConsole: 'https://search.google.com/search-console',
        },
        bing: {
          pingUrl: `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${siteUrl}/sitemap.xml`)}`,
          webmasterTools: 'https://www.bing.com/webmasters',
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get submission info' },
      { status: 500 }
    )
  }
}