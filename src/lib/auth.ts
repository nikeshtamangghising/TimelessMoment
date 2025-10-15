import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmail } from './db-utils'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter not compatible with CredentialsProvider + JWT sessions
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          const user = await getUserByEmail(credentials.email)
          console.log('User found:', user ? { id: user.id, email: user.email, role: user.role } : 'null')
          
          if (!user) {
            console.log('User not found')
            return null
          }

          // Check password
          let isPasswordValid = false
          
          if (user.password) {
            // Compare hashed password
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
            console.log('Password validation (hashed):', isPasswordValid)
          } else {
            // For demo users without hashed passwords, use simple check
            isPasswordValid = credentials.password === 'password'
            console.log('Password validation (plain):', isPasswordValid)
          }

          if (!isPasswordValid) {
            console.log('Password invalid')
            return null
          }

          console.log('Authorization successful')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback - user:', user, 'token:', token)
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token, 'session before:', session)
      if (token) {
        session.user.id = token.id as string || token.sub!
        session.user.role = token.role as string
      }
      console.log('Session callback - session after:', session)
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error: (code, metadata) => {
      console.error('NextAuth Error:', code, metadata);
    },
    warn: (code) => {
      console.warn('NextAuth Warning:', code);
    },
    debug: (code, metadata) => {
      console.log('NextAuth Debug:', code, metadata);
    },
  },
}

// Helper function to get server session
export async function getServerSession() {
  const { getServerSession } = await import('next-auth')
  return getServerSession(authOptions)
}

// Helper function to check if user is admin
export async function isAdmin() {
  const session = await getServerSession()
  return session?.user?.role === 'ADMIN'
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const session = await getServerSession()
  return !!session?.user
}