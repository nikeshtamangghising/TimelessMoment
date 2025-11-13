import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessions, verificationTokens } from '@/lib/db/schema'
import { lt } from 'drizzle-orm'

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

    await db.delete(sessions)
      .where(lt(sessions.expires, thirtyDaysAgo))
    // Note: Drizzle doesn't return count for deleteMany, so we'll estimate
    const sessionsDeleted = 0 // Would need a separate count query if needed

    // Clean up expired verification tokens (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    await db.delete(verificationTokens)
      .where(lt(verificationTokens.expires, sevenDaysAgo))
    const tokensDeleted = 0 // Would need a separate count query if needed

    return NextResponse.json({ 
      success: true, 
      message: 'Session cleanup completed successfully',
      sessionsDeleted,
      tokensDeleted,
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