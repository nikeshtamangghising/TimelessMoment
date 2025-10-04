import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/contexts/cart-context'
import { useCartStore } from '@/stores/cart-store'
import { useFavorites } from '@/hooks/use-favorites'
import { createViewTracker, trackActivity } from '@/lib/activity-tracker'
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from '@/lib/currency'
import { ProductWithCategory } from '@/types'
interface ProductCardProps {
  product: ProductWithCategory
  onAddToCart?: (productId: string) => void
  onProductClick?: (product: ProductWithCategory) => void
  loading?: boolean
  showFavoriteButton?: boolean
  trackViews?: boolean
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onProductClick, 
  loading,
  showFavoriteButton = true,
  trackViews = true
}: ProductCardProps) {
  const { data: session } = useSession()
  const { addToCart, isLoading: cartLoading } = useCart()
  const { openCart } = useCartStore()
  const { isInFavorites, toggleFavorite, isOperationLoading } = useFavorites()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Set up view tracking
  useEffect(() => {
    if (!trackViews || !cardRef.current) return

    // Generate a session ID for guest users if no user is logged in
    const sessionId = !session?.user?.id ? `guest_${Date.now()}_${Math.random()}` : undefined
    
    const observer = createViewTracker(session?.user?.id, sessionId)
    if (observer) {
      cardRef.current.setAttribute('data-product-id', product.id)
      observer.observe(cardRef.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [product.id, session?.user?.id, trackViews])

  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart(product.id)
    } else {
      const success = await addToCart(product, 1)
      if (success) {
        // Track cart activity
        trackActivity({
          productId: product.id,
          activityType: 'CART_ADD',
          userId: session?.user?.id,
        })
        openCart()
      }
    }
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!session?.user) {
      // Could trigger login modal here
      return
    }
    
    await toggleFavorite(product.id)
  }

  const isButtonLoading = loading || cartLoading
  const isFavoriteLoading = isOperationLoading(product.id)
  const isFavorited = isInFavorites(product.id)

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product)
    }
  }

  return (
    <Card 
      ref={cardRef}
      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 hover:border-blue-300 overflow-hidden bg-white relative"
    >
      <div className="relative">
        <div 
          className="aspect-square w-full overflow-hidden bg-gray-100 cursor-pointer relative"
          onClick={handleProductClick}
        >
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          )}
          <Image
            src={product.images[0] || '/placeholder-product.svg'}
            alt={product.name}
            width={400}
            height={400}
            className={`h-full w-full object-cover object-center group-hover:scale-110 transition-all duration-500 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Favorite Button */}
          {showFavoriteButton && session?.user && (
            <button
              onClick={handleFavoriteClick}
              disabled={isFavoriteLoading}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            >
              <svg
                className={`w-5 h-5 transition-colors ${
                  isFavorited 
                    ? 'text-red-500 fill-red-500' 
                    : 'text-gray-400 hover:text-red-500'
                }`}
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* New Badge */}
          {product.isNewArrival && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                NEW
              </span>
            </div>
          )}

          {/* Stock Status Badge */}
          {product.inventory <= 5 && (
            <div className={`absolute ${product.isNewArrival ? 'top-12' : 'top-3'} left-3`}>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                product.inventory === 0 
                  ? 'bg-red-500 text-white'
                  : 'bg-yellow-500 text-white'
              }`}>
                {product.inventory === 0 ? 'Sold Out' : `Only ${product.inventory} left`}
              </span>
            </div>
          )}
          
          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-gray-50 transition-colors">
                Quick View
              </span>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        {/* Category Badge */}
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
            {product.category.name}
          </span>
        </div>
        
        {/* Product Title */}
        <h3 
          className="text-sm font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-2 leading-tight"
          onClick={handleProductClick}
        >
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-baseline space-x-2 mb-3">
          {product.discountPrice ? (
            <>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(product.discountPrice, product.currency || DEFAULT_CURRENCY)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}
              </span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}
            </span>
          )}
        </div>
        
        {/* Add to Cart Button */}
        <div className="mt-4">
          <Button
            onClick={handleAddToCart}
            disabled={product.inventory === 0 || isButtonLoading}
            className={`w-full font-semibold transition-all duration-300 transform hover:scale-105 ${
              product.inventory === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
            }`}
            size="sm"
          >
            {isButtonLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </div>
            ) : product.inventory === 0 ? (
              'Sold Out'
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a1 1 0 001 1h9a1 1 0 001-1v-6M9 9h6m-3-3v6" />
                </svg>
                Add to Cart
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}