import MainLayout from '@/components/layout/main-layout'
import '../globals.css'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}