import { redirect } from 'next/navigation'

// Redirect old /products route to /categories
export default async function ProductsPage() {
  // Next.js App Router: searchParams is now async
  const searchParams = await import('next/navigation').then(m => m.searchParams?.())

  const params = new URLSearchParams()

  const search = searchParams?.get?.('search')
  const category = searchParams?.get?.('category')
  const page = searchParams?.get?.('page')

  if (search) params.set('search', search)
  if (category) params.set('category', category)
  if (page) params.set('page', page)

  const redirectUrl = params.toString()
    ? `/categories?${params.toString()}`
    : '/categories'

  redirect(redirectUrl)
}
