'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline'
import { useSwipeable } from 'react-swipeable'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export default function ProductImageGallery({ 
  images, 
  productName, 
  className = '' 
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const mainImageRef = useRef<HTMLDivElement>(null)
  const modalImageRef = useRef<HTMLDivElement>(null)

  // Ensure we have at least a placeholder image
  const safeImages = images.length > 0 ? images : ['/placeholder-product.jpg']

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length)
    setZoomLevel(1)
    setZoomPosition({ x: 50, y: 50 })
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
    setZoomLevel(1)
    setZoomPosition({ x: 50, y: 50 })
  }

  const selectImage = (index: number) => {
    setCurrentImageIndex(index)
    setZoomLevel(1)
    setZoomPosition({ x: 50, y: 50 })
  }

  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setZoomLevel(1)
    setZoomPosition({ x: 50, y: 50 })
    document.body.style.overflow = 'unset'
  }

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3))
  }

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setZoomPosition({ x, y })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      const touch = e.touches[0]
      setDragStart({ x: touch.clientX, y: touch.clientY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoomLevel > 1) {
      e.preventDefault()
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      
      setZoomPosition(prev => ({
        x: Math.max(0, Math.min(100, prev.x - (deltaX / 5))),
        y: Math.max(0, Math.min(100, prev.y - (deltaY / 5)))
      }))
      
      setDragStart({ x: touch.clientX, y: touch.clientY })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextImage,
    onSwipedRight: prevImage,
    trackMouse: true
  })

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) {
        switch (e.key) {
          case 'ArrowLeft':
            prevImage()
            break
          case 'ArrowRight':
            nextImage()
            break
          case 'Escape':
            closeModal()
            break
          case '+':
          case '=':
            zoomIn()
            break
          case '-':
            zoomOut()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative group">
        <div 
          ref={mainImageRef}
          className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in"
          onClick={openModal}
          onMouseMove={handleMouseMove}
          {...swipeHandlers}
        >
          <Image
            src={safeImages[currentImageIndex]}
            alt={`${productName} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority={currentImageIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openModal()
                }}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg transition-all duration-200"
                aria-label="View fullscreen"
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black bg-opacity-60 text-white text-sm rounded-full">
            {currentImageIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {safeImages.slice(0, 8).map((image, index) => (
            <button
              key={index}
              onClick={() => selectImage(index)}
              className={`aspect-square overflow-hidden rounded-md transition-all duration-200 ${
                currentImageIndex === index
                  ? 'ring-2 ring-indigo-500 ring-offset-2'
                  : 'hover:opacity-75'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                width={150}
                height={150}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 25vw, 150px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all duration-200"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-all duration-200"
                aria-label="Zoom out"
              >
                <MagnifyingGlassMinusIcon className="w-6 h-6" />
              </button>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-all duration-200"
                aria-label="Zoom in"
              >
                <MagnifyingGlassPlusIcon className="w-6 h-6" />
              </button>
              <div className="px-3 py-2 bg-white bg-opacity-20 rounded-full text-white text-sm">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>

            {/* Navigation Arrows */}
            {safeImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all duration-200"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all duration-200"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {safeImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-full">
                {currentImageIndex + 1} / {safeImages.length}
              </div>
            )}

            {/* Modal Image */}
            <div 
              ref={modalImageRef}
              className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              {...swipeHandlers}
            >
              <Image
                src={safeImages[currentImageIndex]}
                alt={`${productName} - Image ${currentImageIndex + 1}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}