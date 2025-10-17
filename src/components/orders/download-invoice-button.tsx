'use client'

import { useState } from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'

interface DownloadInvoiceButtonProps {
  orderId: string
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export default function DownloadInvoiceButton({ 
  orderId, 
  variant = 'outline', 
  size = 'sm',
  className = '',
  showText = true
}: DownloadInvoiceButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      console.log('Starting download for order:', orderId)
      
      const response = await fetch(`/api/orders/${orderId}/invoice`)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to download invoice: ${response.status} - ${errorText}`)
      }

      // Get the invoice content
      const blob = await response.blob()
      console.log('Blob size:', blob.size)
      
      // Always use PDF extension since we're generating PDF invoices
      const fileExtension = 'pdf'
      
      const filename = `invoice-${orderId.slice(-8).toUpperCase()}.${fileExtension}`
      console.log('Download filename:', filename)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('Download completed successfully')
      
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant={variant}
      size={size}
      className={className}
    >
      {isDownloading ? (
        <div className="flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {showText && 'Downloading...'}
        </div>
      ) : (
        <div className="flex items-center">
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          {showText && 'Download Invoice'}
        </div>
      )}
    </Button>
  )
}