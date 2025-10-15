import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, you'd check for Vercel cron secret)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    // Clean up expired sessions (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: thirtyDaysAgo
        }
      }
    })


    // Clean up expired verification tokens (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: sevenDaysAgo
        }
      }
    })


    return NextResponse.json({ 
      success: true, 
      message: 'Session cleanup completed successfully',
      sessionsDeleted: deletedSessions.count,
      tokensDeleted: deletedTokens.count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to cleanup sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}