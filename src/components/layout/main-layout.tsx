import { ReactNode } from 'react'
import Header from './header'
import Footer from './footer'
import CartSidebar from '@/components/cart/cart-sidebar'
import { CartProvider } from '@/contexts/cart-context'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <CartSidebar />
      </div>
    </CartProvider>
  )
}
