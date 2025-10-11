'use client'

import { useState, useEffect } from 'react'

export default function ProductIdTest() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products?limit=5')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data.data)
        console.log('Fetched products:', data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto py-8">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Product ID Test</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">ID: {product.id}</p>
            <p className="text-gray-600">Slug: {product.slug}</p>
            <p className="text-gray-600">Category: {product.category?.name}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Product IDs:</h2>
        <ul>
          {products.map((product) => (
            <li key={product.id} className="mb-2">
              <strong>{product.name}:</strong> {product.id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}