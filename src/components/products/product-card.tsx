import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { useCartStore } from '@/stores/cart-store'

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
  loading?: boolean
}

export default function ProductCard({ product, onAddToCart, loading }: ProductCardProps) {
  const { addToCart, isLoading: cartLoading } = useCart()
  const { openCart } = useCartStore()

  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart(product.id)
    } else {
      const success = await addToCart(product, 1)
      if (success) {
        openCart()
      }
    }
  }

  const isButtonLoading = loading || cartLoading

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
        <Image
          src={product.images[0] || '/placeholder-product.jpg'}
          alt={product.name}
          width={300}
          height={300}
          className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            <Link href={`/products/${product.slug}`} className="hover:text-indigo-600">
              {product.name}
            </Link>
          </h3>
          <p className="text-sm font-medium text-gray-900 ml-2">
            ${product.price.toFixed(2)}
          </p>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${
            product.inventory === 0 
              ? 'text-red-600'
              : product.inventory <= (product.lowStockThreshold || 5)
                ? 'text-yellow-600'
                : 'text-green-600'
          }`}>
            {product.inventory === 0 
              ? 'Out of stock' 
              : product.inventory <= (product.lowStockThreshold || 5)
                ? `Only ${product.inventory} left`
                : `${product.inventory} in stock`
            }
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {product.category}
          </span>
        </div>
        
        <div className="flex justify-center mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            product.inventory === 0 
              ? 'bg-red-100 text-red-800'
              : product.inventory <= (product.lowStockThreshold || 5)
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}>
            {product.inventory === 0 
              ? '❌ Out of Stock'
              : product.inventory <= (product.lowStockThreshold || 5)
                ? '⚠️ Low Stock'
                : '✅ In Stock'
            }
          </span>
        </div>
        
        {onAddToCart && (
          <div className="mt-4">
            <Button
              onClick={handleAddToCart}
              disabled={product.inventory === 0 || isButtonLoading}
              loading={isButtonLoading}
              className="w-full"
              size="sm"
            >
              {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}