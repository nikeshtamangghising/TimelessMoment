'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  name: string
  url: string
  isCurrentPage?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items.length) return null

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {/* Home Icon */}
        <li className="inline-flex items-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
            aria-label="Go to homepage"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Home
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={item.url} className="inline-flex items-center">
            <ChevronRightIcon className="w-5 h-5 text-gray-400 mx-1" />
            {item.isCurrentPage ? (
              <span 
                className="text-sm font-medium text-gray-500 cursor-default"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Utility function to generate breadcrumbs from pathname
export function generateBreadcrumbs(pathname: string, productName?: string, categoryName?: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  if (segments.length === 0) return breadcrumbs

  // Handle different page types
  switch (segments[0]) {
    case 'products':
      if (segments.length === 1) {
        // Products listing page
        breadcrumbs.push({ name: 'Products', url: '/products' })
      } else if (segments.length === 2) {
        // Individual product page
        breadcrumbs.push({ name: 'Products', url: '/products' })
        if (categoryName) {
          breadcrumbs.push({ 
            name: categoryName, 
            url: `/products?category=${encodeURIComponent(categoryName)}` 
          })
        }
        if (productName) {
          breadcrumbs.push({ 
            name: productName, 
            url: `/products/${segments[1]}`,
            isCurrentPage: true 
          })
        }
      }
      break
      
    case 'categories':
      breadcrumbs.push({ name: 'Categories', url: '/categories' })
      if (segments.length === 2) {
        breadcrumbs.push({ 
          name: segments[1].replace(/-/g, ' '), 
          url: `/categories/${segments[1]}`,
          isCurrentPage: true 
        })
      }
      break
      
    case 'blog':
      if (segments.length === 1) {
        breadcrumbs.push({ name: 'Blog', url: '/blog' })
      } else {
        breadcrumbs.push({ name: 'Blog', url: '/blog' })
        breadcrumbs.push({ 
          name: segments[1].replace(/-/g, ' '), 
          url: `/blog/${segments[1]}`,
          isCurrentPage: true 
        })
      }
      break
      
    case 'cart':
      breadcrumbs.push({ name: 'Shopping Cart', url: '/cart', isCurrentPage: true })
      break
      
    case 'checkout':
      breadcrumbs.push({ name: 'Cart', url: '/cart' })
      breadcrumbs.push({ name: 'Checkout', url: '/checkout', isCurrentPage: true })
      break
      
    default:
      // Generic breadcrumb generation
      let currentPath = ''
      segments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLast = index === segments.length - 1
        breadcrumbs.push({
          name: segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          url: currentPath,
          isCurrentPage: isLast
        })
      })
  }

  return breadcrumbs
}