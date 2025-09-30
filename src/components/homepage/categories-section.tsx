'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
// Inline SVG icons to avoid import issues
const DevicePhoneMobileIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
  </svg>
)

const ComputerDesktopIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const MusicalNoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
)

interface Category {
  name: string
  slug: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  productCount?: number
}

interface CategoriesSectionProps {
  categories: string[]
}

// Map category names to icons and gradients
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes('electronics') || name.includes('phone') || name.includes('mobile')) {
    return { icon: DevicePhoneMobileIcon, gradient: 'from-blue-500 to-cyan-500' }
  }
  if (name.includes('computer') || name.includes('laptop') || name.includes('tech')) {
    return { icon: ComputerDesktopIcon, gradient: 'from-purple-500 to-pink-500' }
  }
  if (name.includes('clothing') || name.includes('fashion') || name.includes('apparel')) {
    return { icon: TagIcon, gradient: 'from-pink-500 to-rose-500' }
  }
  if (name.includes('home') || name.includes('furniture') || name.includes('decor')) {
    return { icon: HomeIcon, gradient: 'from-green-500 to-emerald-500' }
  }
  if (name.includes('book') || name.includes('education') || name.includes('learning')) {
    return { icon: BookOpenIcon, gradient: 'from-amber-500 to-orange-500' }
  }
  if (name.includes('health') || name.includes('beauty') || name.includes('wellness')) {
    return { icon: HeartIcon, gradient: 'from-red-500 to-pink-500' }
  }
  if (name.includes('camera') || name.includes('photo') || name.includes('video')) {
    return { icon: CameraIcon, gradient: 'from-indigo-500 to-purple-500' }
  }
  if (name.includes('music') || name.includes('audio') || name.includes('sound')) {
    return { icon: MusicalNoteIcon, gradient: 'from-violet-500 to-purple-500' }
  }
  // Default
  return { icon: TagIcon, gradient: 'from-gray-500 to-slate-500' }
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  // Convert category strings to category objects with icons and gradients
  const categoryObjects: Category[] = categories.map(category => {
    const { icon, gradient } = getCategoryIcon(category)
    return {
      name: category,
      slug: category.toLowerCase().replace(/\s+/g, '-'),
      icon,
      gradient,
    }
  })

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            ✨ Explore Categories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Shop by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our carefully curated collections across different categories. 
            Find exactly what you're looking for with ease.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-12">
          {categoryObjects.map((category, index) => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.slug}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-8 text-center relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Icon */}
                    <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-700 transition-colors mb-2">
                      {category.name}
                    </h3>
                    
                    {/* Explore Text */}
                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                      Explore Collection
                    </p>
                    
                    {/* Hover Arrow */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="text-center">
          <Link
            href="/categories"
            className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Categories
            <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}