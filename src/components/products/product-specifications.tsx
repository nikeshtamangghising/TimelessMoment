'use client'

import { Product } from '@/types'

interface ProductSpecificationsProps {
  product: Product
  className?: string
}

export default function ProductSpecifications({ product, className = '' }: ProductSpecificationsProps) {
  // Extract specifications from product data
  const specifications = [
    {
      label: 'SKU',
      value: product.sku || product.id
    },
    {
      label: 'Category',
      value: typeof product.category === 'object' ? product.category?.name : 'Uncategorized'
    },
    {
      label: 'Brand',
      value: typeof product.brand === 'object' ? product.brand?.name : 'Not specified'
    },
    {
      label: 'Weight',
      value: product.weight ? `${product.weight} kg` : 'Not specified'
    },
    {
      label: 'Dimensions',
      value: product.dimensions 
        ? `${product.dimensions.length || 'N/A'} × ${product.dimensions.width || 'N/A'} × ${product.dimensions.height || 'N/A'} cm`
        : 'Not specified'
    },
    {
      label: 'Material',
      value: product.tags?.find(tag => tag.toLowerCase().includes('material')) || 'Not specified'
    },
    {
      label: 'Color',
      value: product.tags?.find(tag => tag.toLowerCase().includes('color')) || 'Not specified'
    },
    {
      label: 'In Stock',
      value: product.inventory > 0 ? 'Yes' : 'No'
    },
    {
      label: 'Stock Quantity',
      value: product.inventory.toString()
    },
    {
      label: 'Low Stock Threshold',
      value: `${product.lowStockThreshold || 5} units`
    }
  ]

  return (
    <div className={`${className}`}>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Product Specifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            Detailed information about this product
          </p>
        </div>
        
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {specifications.map((spec, index) => (
              <div key={index}>
                <dt className="text-sm font-medium text-gray-500">
                  {spec.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Additional Product Information */}
      {product.tags && product.tags.length > 0 && (
        <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
