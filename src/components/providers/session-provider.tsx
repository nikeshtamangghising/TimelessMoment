'use client'

import { SessionProvider, SessionProviderProps } from 'next-auth/react'

export default function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session?: SessionProviderProps['session']
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}