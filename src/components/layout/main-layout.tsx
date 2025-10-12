import { ReactNode } from 'react'
import Header from './header'
import Footer from './footer'
import MobileBottomNav from './mobile-bottom-nav'
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
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
        <CartSidebar />
      </div>
    </CartProvider>
  )
}