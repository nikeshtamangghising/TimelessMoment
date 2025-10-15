'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, StarIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { ProductWithCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { useCartStore } from '@/stores/cart-store'
import { formatCurrency, getFreeShippingThreshold, DEFAULT_CURRENCY } from '@/lib/currency'

interface ProductModalProps {
  product: ProductWithCategory | null
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { addToCart, isLoading: cartLoading } = useCart()
  const { openCart } = useCartStore()

  if (!product) return null

  const handleAddToCart = async () => {
    // Create a deep copy of the product to avoid reference issues
    const productCopy = JSON.parse(JSON.stringify(product))
    
    const success = await addToCart(productCopy, quantity)
    if (success) {
      openCart()
      onClose()
    }
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    // Here you would typically call an API to add/remove from wishlist
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.origin + `/products/${product.slug}`,
        })
      } catch (error) {
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin + `/products/${product.slug}`)
        // You could show a toast notification here
      } catch (error) {
      }
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
    )
  }

  const images = product.images?.length ? product.images : ['/placeholder-product.jpg']

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <div className="absolute right-4 top-4 z-10">
                  <button
                    type="button"
                    className="rounded-full bg-white/90 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                  {/* Product Images */}
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={images[currentImageIndex]}
                        alt={product.name}
                        fill
                        className="h-full w-full object-cover"
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      
                      {/* Image Navigation */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Image Indicator */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`h-2 w-2 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Images */}
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative aspect-square overflow-hidden rounded-md ${
                              index === currentImageIndex ? 'ring-2 ring-indigo-500' : ''
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="100px"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {product.category.name}
                        </span>
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <StarIconSolid
                                key={rating}
                                className="h-4 w-4 text-yellow-400"
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">(4.8)</span>
                        </div>
                      </div>
                      
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                        {product.name}
                      </h1>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl font-bold text-indigo-600">
                          {formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleWishlist}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {isWishlisted ? (
                              <HeartIconSolid className="h-6 w-6 text-red-500" />
                            ) : (
                              <HeartIcon className="h-6 w-6" />
                            )}
                          </button>
                          <button
                            onClick={handleShare}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ShareIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Inventory Status */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">Availability:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.inventory === 0 
                          ? 'bg-red-100 text-red-800'
                          : product.inventory <= (product.lowStockThreshold || 5)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {product.inventory === 0 
                          ? '❌ Out of Stock'
                          : product.inventory <= (product.lowStockThreshold || 5)
                            ? `⚠️ Only ${product.inventory} left`
                            : `✅ ${product.inventory} in stock`
                        }
                      </span>
                    </div>

                    {/* Quantity and Add to Cart */}
                    {product.inventory > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={product.inventory}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, Math.min(product.inventory, parseInt(e.target.value) || 1)))}
                              className="w-16 px-2 py-2 text-center border-0 focus:ring-0"
                            />
                            <button
                              onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <Button
                            onClick={handleAddToCart}
                            disabled={cartLoading}
                            loading={cartLoading}
                            className="flex-1"
                            size="lg"
                          >
                            Add to Cart
                          </Button>
                          <a
                            href={`/products/${product.slug}`}
                            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center"
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          Free shipping on orders over {formatCurrency(getFreeShippingThreshold(), DEFAULT_CURRENCY)}
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                          30-day return policy
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                          1-year warranty included
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                          Secure payment processing
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}