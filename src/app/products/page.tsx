import { redirect } from 'next/navigation'

// Redirect old /products route to /categories
interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Next.js App Router: searchParams is now async
  const searchParamsValue = await searchParams

  const params = new URLSearchParams()

  const search = searchParamsValue?.search as string
  const category = searchParamsValue?.category as string
  const page = searchParamsValue?.page as string

  if (search) params.set('search', search)
  if (category) params.set('category', category)
  if (page) params.set('page', page)

  const redirectUrl = params.toString()
    ? `/categories?${params.toString()}`
    : '/categories'

  redirect(redirectUrl)
}
