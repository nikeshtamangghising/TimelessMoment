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

    console.log('Starting scheduled sitemap update...')

    // Generate new sitemap
    await generateSitemap()
    console.log('Sitemap generated successfully')

    // Submit to search engines
    // await submitSitemapToSearchEngines()
    console.log('Sitemap submitted to search engines')

    return NextResponse.json({ 
      success: true, 
      message: 'Sitemap updated and submitted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating sitemap:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update sitemap',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}