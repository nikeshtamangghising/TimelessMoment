'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import Button from './button'
import Loading from './loading'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  maxFileSize?: number // in MB
  error?: string
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  maxFileSize = 5,
  error 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Check if adding these files would exceed the limit
    if (images.length + fileArray.length > maxImages) {
      alert(`You can only upload a maximum of ${maxImages} images. Current: ${images.length}`)
      return
    }

    // Validate files before uploading
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file`)
        return
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is ${maxFileSize}MB`)
        return
      }
    }

    setUploading(true)

    try {
      const formData = new FormData()
      fileArray.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Handle successful uploads
      if (result.success && result.urls && result.urls.length > 0) {
        // Add new URLs to existing images
        onImagesChange([...images, ...result.urls])
        
        // Show success message
        if (result.partialSuccess && result.warnings) {
          alert(`Upload completed with warnings:\n${result.warnings.join('\n')}`)
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      
      let errorMessage = 'Failed to upload images'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Show more specific error messages
      if (errorMessage.includes('Cloudinary not configured')) {
        alert('Image upload requires Cloudinary configuration. Please contact the administrator to set up cloud storage.')
      } else if (errorMessage.includes('All uploads failed')) {
        alert('All image uploads failed. Please check your files and try again.')
      } else {
        alert(`Upload failed: ${errorMessage}`)
      }
    } finally {
      setUploading(false)
    }
  }, [images, maxImages, maxFileSize, onImagesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      if (images.length >= maxImages) {
        alert(`You can only add a maximum of ${maxImages} images`)
        return
      }
      onImagesChange([...images, urlInput.trim()])
      setUrlInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4" suppressHydrationWarning>
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        suppressHydrationWarning
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          suppressHydrationWarning
        />

        <div className="text-center" suppressHydrationWarning>
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4" suppressHydrationWarning>
            <p className="text-sm text-gray-600">
              <button
                type="button"
                onClick={openFileDialog}
                disabled={uploading || images.length >= maxImages}
                className="font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
                suppressHydrationWarning
              >
                Click to upload
              </button>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB each (max {maxImages} images)
            </p>
          </div>

          {uploading && (
            <div className="mt-4 flex items-center justify-center" suppressHydrationWarning>
              <Loading size="sm" />
              <span className="ml-2 text-sm text-gray-600">Uploading...</span>
            </div>
          )}
        </div>
      </div>

      {/* URL Input */}
      <div className="flex space-x-2" suppressHydrationWarning>
        <input
          type="url"
          placeholder="Or enter image URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          disabled={images.length >= maxImages}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
          suppressHydrationWarning
        />
        <Button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim() || images.length >= maxImages}
          size="sm"
        >
          Add URL
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600" suppressHydrationWarning>{error}</p>
      )}

      {/* Image Preview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" suppressHydrationWarning>
        {images.map((image, index) => (
          <div key={index} className="relative group" suppressHydrationWarning>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden" suppressHydrationWarning>
              <Image
                src={image}
                alt={`Product image ${index + 1}`}
                width={200}
                height={200}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-product.svg'
                }}
                suppressHydrationWarning
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              suppressHydrationWarning
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity" suppressHydrationWarning>
              Image {index + 1}
              {index === 0 && <span className="ml-1">(Primary)</span>}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg" suppressHydrationWarning>
          <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No images added yet</p>
          <p className="text-xs text-gray-400">Upload files or add URLs to get started</p>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-sm text-gray-500" suppressHydrationWarning>
          {images.length} of {maxImages} images added
          {images.length > 0 && <span className="ml-2">• First image will be used as primary</span>}
        </p>
      )}
    </div>
  )
}