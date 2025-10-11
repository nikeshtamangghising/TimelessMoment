'use client'

import { useState } from 'react'

export default function CacheTest() {
  const [productId1, setProductId1] = useState('')
  const [productId2, setProductId2] = useState('')
  const [product1, setProduct1] = useState<any>(null)
  const [product2, setProduct2] = useState<any>(null)
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [error1, setError1] = useState<string | null>(null)
  const [error2, setError2] = useState<string | null>(null)

  const fetchProduct1 = async () => {
    if (!productId1) return
    
    try {
      setLoading1(true)
      setError1(null)
      console.log('Fetching product 1 with ID:', productId1)
      const response = await fetch(`/api/products/${productId1}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProduct1(data)
      console.log('Fetched product 1:', data)
    } catch (err) {
      setError1(err instanceof Error ? err.message : 'Failed to fetch product')
      console.error('Error fetching product 1:', err)
    } finally {
      setLoading1(false)
    }
  }

  const fetchProduct2 = async () => {
    if (!productId2) return
    
    try {
      setLoading2(true)
      setError2(null)
      console.log('Fetching product 2 with ID:', productId2)
      const response = await fetch(`/api/products/${productId2}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProduct2(data)
      console.log('Fetched product 2:', data)
    } catch (err) {
      setError2(err instanceof Error ? err.message : 'Failed to fetch product')
      console.error('Error fetching product 2:', err)
    } finally {
      setLoading2(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Cache Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Product 1</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={productId1}
                onChange={(e) => setProductId1(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter product ID"
              />
              <button
                onClick={fetchProduct1}
                disabled={loading1 || !productId1}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading1 ? 'Loading...' : 'Fetch'}
              </button>
            </div>
          </div>
          
          {error1 && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error1}
            </div>
          )}
          
          {product1 && (
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">{product1.name}</h3>
              <div className="grid grid-cols-1 gap-2">
                <p><strong>ID:</strong> {product1.id}</p>
                <p><strong>Slug:</strong> {product1.slug}</p>
                <p><strong>Price:</strong> ${product1.price}</p>
                <p><strong>Inventory:</strong> {product1.inventory}</p>
                <p><strong>Category:</strong> {product1.category?.name}</p>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Product 2</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={productId2}
                onChange={(e) => setProductId2(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter product ID"
              />
              <button
                onClick={fetchProduct2}
                disabled={loading2 || !productId2}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading2 ? 'Loading...' : 'Fetch'}
              </button>
            </div>
          </div>
          
          {error2 && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error2}
            </div>
          )}
          
          {product2 && (
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">{product2.name}</h3>
              <div className="grid grid-cols-1 gap-2">
                <p><strong>ID:</strong> {product2.id}</p>
                <p><strong>Slug:</strong> {product2.slug}</p>
                <p><strong>Price:</strong> ${product2.price}</p>
                <p><strong>Inventory:</strong> {product2.inventory}</p>
                <p><strong>Category:</strong> {product2.category?.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {product1 && product2 && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Same ID?</strong> {product1.id === product2.id ? 'Yes' : 'No'}</p>
              <p><strong>Same Name?</strong> {product1.name === product2.name ? 'Yes' : 'No'}</p>
              <p><strong>Same Slug?</strong> {product1.slug === product2.slug ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>ID 1:</strong> {product1.id}</p>
              <p><strong>ID 2:</strong> {product2.id}</p>
              <p><strong>Name 1:</strong> {product1.name}</p>
              <p><strong>Name 2:</strong> {product2.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}