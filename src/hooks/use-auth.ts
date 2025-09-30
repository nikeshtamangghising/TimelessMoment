'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('Auth status:', status)
    console.log('Session data:', session)
  }, [status, session])

  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.role === 'ADMIN'
  const isLoading = status === 'loading'

  return {
    user: session?.user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isCustomer: session?.user?.role === 'CUSTOMER',
    status, // Include raw status for debugging
  }
}
