'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { Card, CardContent } from '@/components/ui/card'
import AddToCartSection from '@/components/products/add-to-cart-section'
import ProductRatingDisplay from '@/components/products/product-rating-display'
import TrustBadgesClient from '@/components/ui/trust-badges-client'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'
import { getAttributeValue } from '@/lib/product-attributes'
import { Product } from '@/types'

interface ProductInfoSectionProps {
  product: Product
}

export default function ProductInfoSection({ product }: ProductInfoSectionProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  
  // Debug logging
  console.log('Product attributes debug:', {
    productName: product.name,
    productSlug: product.slug,
    attributesCount: (product as any).attributes?.length || 0,
    attributes: (product as any).attributes || [],
    hasAttributes: !!(product as any).attributes
  })

  const productWithCategory = product as any
  const categoryName = typeof productWithCategory.category === 'object' 
    ? productWithCategory.category?.name 
    : productWithCategory.category || 'Uncategorized'

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowShareMenu(false)
    // Could add a toast notification here
  }

  const discountPercentage = product.discountPrice 
    ? Math.round(((product.price - (product.discountPrice as number)) / product.price) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Link href="/products" className="hover:text-indigo-600 transition-colors">
            Products
          </Link>
          <span>/</span>
          <Link 
            href={`/products?category=${categoryName}`} 
            className="hover:text-indigo-600 transition-colors"
          >
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>
      </nav>

      {/* Product Title & Actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
            {product.name}
          </h1>
          
          {/* Rating Display */}
          <div className="mb-4">
            <ProductRatingDisplay productId={product.id} />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="p-2 rounded-full border border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? (
              <HeartIconSolid className="w-6 h-6 text-red-500" />
            ) : (
              <HeartIcon className="w-6 h-6 text-gray-600" />
            )}
          </button>
          
          <div className="relative">
            <button
              onClick={handleShare}
              className="p-2 rounded-full border border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
              aria-label="Share product"
            >
              <ShareIcon className="w-6 h-6 text-gray-600" />
            </button>
            
            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={copyToClipboard}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Copy link
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Share on Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Share on Facebook
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {product.discountPrice ? (
              <>
                <span className="text-4xl font-bold text-green-600">
                  {formatCurrency(product.discountPrice, (product as any).currency || DEFAULT_CURRENCY)}
                </span>
                <div className="flex flex-col">
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(product.price, (product as any).currency || DEFAULT_CURRENCY)}
                  </span>
                  <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium inline-block">
                    {discountPercentage}% OFF
                  </span>
                </div>
              </>
            ) : (
              <span className="text-4xl font-bold text-indigo-600">
                {formatCurrency(product.price, (product as any).currency || DEFAULT_CURRENCY)}
              </span>
            )}
          </div>
          
          <div className="text-right">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200">
              {categoryName}
            </span>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="prose prose-gray max-w-none">
        {Boolean((product as any).shortDescription) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
            <p className="text-gray-700 leading-relaxed">
              {(product as any).shortDescription}
            </p>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <p className="text-gray-600 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Stock Information */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Availability:</span>
              <div className="text-right">
                <div className={`flex items-center space-x-2 ${
                  product.inventory > 0 
                    ? product.inventory <= (product.lowStockThreshold || 5)
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                    : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    product.inventory > 0 
                      ? product.inventory <= (product.lowStockThreshold || 5)
                        ? 'bg-yellow-500 animate-pulse' 
                        : 'bg-green-500'
                      : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {product.inventory === 0 
                      ? 'Out of stock' 
                      : product.inventory <= (product.lowStockThreshold || 5)
                        ? `Only ${product.inventory} left in stock`
                        : `${product.inventory} in stock`
                    }
                  </span>
                </div>
                {product.inventory > 0 && product.inventory <= (product.lowStockThreshold || 5) && (
                  <div className="text-xs text-yellow-600 mt-1 flex items-center">
                    <span className="animate-bounce mr-1">⚠️</span>
                    Limited stock - order soon!
                  </div>
                )}
              </div>
            </div>
            
            {/* Product Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-900">SKU:</span>
                <span className="text-gray-600 font-mono">{(product as any).sku || product.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-900">Brand:</span>
                <span className="text-gray-600">{typeof (product as any).brand === 'object' ? (product as any).brand?.name || '—' : ((product as any).brand || '—')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-900">Weight:</span>
                <span className="text-gray-600">{(product as any).weight ? `${(product as any).weight} kg` : '—'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-900">Material:</span>
                <span className="text-gray-600">{getAttributeValue((product as any).attributes, 'material')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-900">Color:</span>
                <span className="text-gray-600">{getAttributeValue((product as any).attributes, 'color')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add to Cart Section */}
      <AddToCartSection product={product} />

      {/* Trust Badges */}
      <TrustBadgesClient />
    </div>
  )
}