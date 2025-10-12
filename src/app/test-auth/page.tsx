'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('Auth Status:', status)
    console.log('Session Data:', session)
  }, [status, session])

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      {session ? (
        <div>
          <p className="mb-4">Signed in as {session.user?.email}</p>
          <p className="mb-4">User ID: {session.user?.id}</p>
          <p className="mb-4">Role: {session.user?.role}</p>
          <button 
            onClick={() => signOut()}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4">Not signed in</p>
          <button 
            onClick={() => signIn('credentials', {
              email: 'admin@example.com',
              password: 'password',
              redirect: false
            })}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  )
}