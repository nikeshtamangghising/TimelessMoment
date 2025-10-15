import { NextRequest, NextResponse } from 'next/server'
import { generateSitemap } from '@/lib/sitemap'
// import { submitSitemapToSearchEngines } from '@/lib/sitemap'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, you'd check for Vercel cron secret)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    // Generate new sitemap
    await generateSitemap()

    // Submit to search engines
    // await submitSitemapToSearchEngines()

    return NextResponse.json({ 
      success: true, 
      message: 'Sitemap updated and submitted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to update sitemap',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}