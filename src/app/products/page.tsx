import { redirect } from 'next/navigation'

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    page?: string
  }
}

// Redirect old /products route to /categories
export default function ProductsPage({ searchParams }: ProductsPageProps) {
  // Preserve search parameters when redirecting
  const params = new URLSearchParams()
  
  if (searchParams.search) {
    params.set('search', searchParams.search)
  }
  if (searchParams.category) {
    params.set('category', searchParams.category)
  }
  if (searchParams.page) {
    params.set('page', searchParams.page)
  }
  
  const redirectUrl = params.toString() 
    ? `/categories?${params.toString()}`
    : '/categories'
    
  redirect(redirectUrl)
}
