import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '@/components/products/product-card'
import { Product } from '@/types'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children }: any) {
    return <a href={href}>{children}</a>
  }
})

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'This is a test product description',
  price: 99.99,
  images: ['https://example.com/image.jpg'],
  inventory: 10,
  category: 'Electronics',
  slug: 'test-product',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [],
}

describe('ProductCard Component', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('This is a test product description')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('10 in stock')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('shows out of stock when inventory is 0', () => {
    const outOfStockProduct = { ...mockProduct, inventory: 0 }
    render(<ProductCard product={outOfStockProduct} />)
    
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('calls onAddToCart when add to cart button is clicked', () => {
    const mockAddToCart = jest.fn()
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />)
    
    const addToCartButton = screen.getByText('Add to Cart')
    fireEvent.click(addToCartButton)
    
    expect(mockAddToCart).toHaveBeenCalledWith('1')
  })

  it('disables add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inventory: 0 }
    const mockAddToCart = jest.fn()
    render(<ProductCard product={outOfStockProduct} onAddToCart={mockAddToCart} />)
    
    const button = screen.getByText('Out of Stock')
    expect(button).toBeDisabled()
  })

  it('shows loading state when loading prop is true', () => {
    const mockAddToCart = jest.fn()
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} loading />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})