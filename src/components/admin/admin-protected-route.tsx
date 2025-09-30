'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Loading from '@/components/ui/loading'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Set up a timeout to redirect if loading takes too long
    const timeout = setTimeout(() => {
      if (isLoading && !isAuthenticated) {
        console.log('Auth loading timeout, redirecting to signin')
        setHasRedirected(true)
        router.push('/auth/signin?redirect=/admin')
      }
    }, 2000) // 2 second timeout

    return () => clearTimeout(timeout)
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to signin')
        setHasRedirected(true)
        router.push('/auth/signin?redirect=/admin')
        return
      }

      if (!isAdmin) {
        console.log('User not admin, redirecting to home')
        setHasRedirected(true)
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // If we've initiated a redirect, show nothing
  if (hasRedirected) {
    return null
  }

  // Show loading state only briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="lg" />
          <div className="mt-4 text-gray-600">Verifying admin access...</div>
          <div className="mt-2 text-sm text-gray-500">
            Please wait or{' '}
            <a href="/auth/signin?redirect=/admin" className="text-indigo-600 hover:text-indigo-500">
              click here to sign in
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Final check before rendering
  if (!isAuthenticated || !isAdmin) {
    // This should not happen due to the useEffect above, but just in case
    router.push('/auth/signin?redirect=/admin')
    return null
  }

  return <>{children}</>
}
