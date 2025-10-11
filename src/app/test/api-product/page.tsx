'use client'

import { useState } from 'react'

export default function ApiProductTest() {
  const [productId, setProductId] = useState('')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = async () => {
    if (!productId) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching product with ID:', productId)
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProduct(data)
      console.log('Fetched product:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API Product Test</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product ID:
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter product ID"
          />
          <button
            onClick={fetchProduct}
            disabled={loading || !productId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Product'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {product && (
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>ID:</strong> {product.id}</p>
              <p><strong>Slug:</strong> {product.slug}</p>
              <p><strong>Price:</strong> ${product.price}</p>
              <p><strong>Inventory:</strong> {product.inventory}</p>
            </div>
            <div>
              <p><strong>Category:</strong> {product.category?.name}</p>
              <p><strong>Active:</strong> {product.isActive ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}