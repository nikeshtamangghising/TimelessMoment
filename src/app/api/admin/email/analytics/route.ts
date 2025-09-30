import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailTracker } from '@/lib/email-tracking'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '50')
    const template = searchParams.get('template')

    // Get email statistics
    const stats = await EmailTracker.getEmailStats(days)

    // Get recent emails
    const recentEmails = template 
      ? await EmailTracker.getEmailsByTemplate(template, days)
      : await EmailTracker.getRecentEmails(limit)

    // Get failed emails for potential retry
    const failedEmails = await EmailTracker.getFailedEmails(24)

    return NextResponse.json({
      stats,
      recentEmails: recentEmails.slice(0, limit),
      failedEmails: failedEmails.slice(0, 10),
      period: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Email analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get email analytics' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '90')

    // Clean up old email logs
    const deletedCount = await EmailTracker.cleanupOldLogs(daysToKeep)

    return NextResponse.json({
      message: `Cleaned up ${deletedCount} old email logs`,
      deletedCount,
      daysToKeep
    })

  } catch (error) {
    console.error('Email cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup email logs' },
      { status: 500 }
    )
  }
}