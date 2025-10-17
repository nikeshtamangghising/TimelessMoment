import { Product } from '@/types'
import ProductCard from './product-card'

interface ProductGridProps {
  products: Product[]
  onAddToCart?: (productId: string) => void
  loading?: boolean
}

export default function ProductGrid({ products, onAddToCart, loading }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product as any}
        />
      ))}
    </div>
  )
}
