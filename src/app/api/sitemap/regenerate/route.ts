import { NextRequest, NextResponse } from 'next/server'
import { generateSitemap } from '@/lib/sitemap'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Generate new sitemap
    const sitemap = await generateSitemap()
    
    return NextResponse.json({
      message: 'Sitemap regenerated successfully',
      entries: sitemap.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error regenerating sitemap:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate sitemap' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get current sitemap info without regenerating
    const sitemap = await generateSitemap()
    
    return NextResponse.json({
      entries: sitemap.length,
      lastGenerated: new Date().toISOString(),
      sitemapUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}/sitemap.xml`,
    })
  } catch (error) {
    console.error('Error getting sitemap info:', error)
    return NextResponse.json(
      { error: 'Failed to get sitemap info' },
      { status: 500 }
    )
  }
}