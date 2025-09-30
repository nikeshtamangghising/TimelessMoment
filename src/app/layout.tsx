import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'
import { CartProvider } from '@/contexts/cart-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'E-commerce Platform',
  description: 'Modern e-commerce platform built with Next.js 15',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
