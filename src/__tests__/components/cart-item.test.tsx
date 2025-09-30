import { render, screen, fireEvent } from '@testing-library/react'
import CartItem from '@/components/cart/cart-item'
import { CartItem as CartItemType, Product } from '@/types'

// Mock the cart store
const mockUpdateQuantity = jest.fn()
const mockRemoveItem = jest.fn()

jest.mock('@/stores/cart-store', () => ({
  useCartStore: () => ({
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
  }),
}))

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ href, children }: any) {
    return <a href={href}>{children}</a>
  }
})

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
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

const mockCartItem: CartItemType = {
  productId: '1',
  quantity: 2,
  product: mockProduct,
}

describe('CartItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders cart item correctly', () => {
    render(<CartItem item={mockCartItem} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('$199.98')).toBeInTheDocument() // 99.99 * 2
  })

  it('shows inventory warning for low stock', () => {
    const lowStockProduct = { ...mockProduct, inventory: 3 }
    const lowStockItem = { ...mockCartItem, product: lowStockProduct }
    
    render(<CartItem item={lowStockItem} />)
    
    expect(screen.getByText('Only 3 left in stock')).toBeInTheDocument()
  })

  it('handles quantity increase', () => {
    render(<CartItem item={mockCartItem} />)
    
    const increaseButton = screen.getByRole('button', { name: /plus/i })
    fireEvent.click(increaseButton)
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3)
  })

  it('handles quantity decrease', () => {
    render(<CartItem item={mockCartItem} />)
    
    const decreaseButton = screen.getByRole('button', { name: /minus/i })
    fireEvent.click(decreaseButton)
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 1)
  })

  it('removes item when quantity reaches 0', () => {
    const singleItem = { ...mockCartItem, quantity: 1 }
    render(<CartItem item={singleItem} />)
    
    const decreaseButton = screen.getByRole('button', { name: /minus/i })
    fireEvent.click(decreaseButton)
    
    expect(mockRemoveItem).toHaveBeenCalledWith('1')
  })

  it('handles item removal', () => {
    render(<CartItem item={mockCartItem} />)
    
    const removeButton = screen.getByTitle('Remove item')
    fireEvent.click(removeButton)
    
    expect(mockRemoveItem).toHaveBeenCalledWith('1')
  })

  it('disables increase button when at max inventory', () => {
    const maxQuantityItem = { ...mockCartItem, quantity: 10 } // Same as inventory
    render(<CartItem item={maxQuantityItem} />)
    
    const increaseButton = screen.getByRole('button', { name: /plus/i })
    expect(increaseButton).toBeDisabled()
  })

  it('disables decrease button when at minimum quantity', () => {
    const minQuantityItem = { ...mockCartItem, quantity: 1 }
    render(<CartItem item={minQuantityItem} />)
    
    const decreaseButton = screen.getByRole('button', { name: /minus/i })
    expect(decreaseButton).toBeDisabled()
  })
})