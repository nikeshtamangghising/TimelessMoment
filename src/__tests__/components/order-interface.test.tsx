import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import OrdersPage from '@/app/orders/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user123', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}))

// Mock the MainLayout and ProtectedRoute components
jest.mock('@/components/layout/main-layout', () => {
  return function MockMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>
  }
})

jest.mock('@/components/auth/protected-route', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>
  }
})

// Mock fetch
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
}

describe('Orders Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should render loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )

    render(<OrdersPage />)
    
    expect(screen.getByText('My Orders')).toBeInTheDocument()
    expect(screen.getByText('Track and manage your order history')).toBeInTheDocument()
  })

  it('should render orders when data is loaded', async () => {
    const mockOrders = {
      data: [
        {
          id: 'order123',
          status: 'PAID',
          total: 99.99,
          createdAt: '2024-01-15T10:00:00Z',
          items: [
            {
              id: 'item1',
              quantity: 2,
              price: 49.99,
              product: {
                name: 'Test Product',
                slug: 'test-product',
              },
            },
          ],
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders),
    })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Order #ORDER123')).toBeInTheDocument()
      expect(screen.getByText('$99.99')).toBeInTheDocument()
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('PAID')).toBeInTheDocument()
    })
  })

  it('should render empty state when no orders', async () => {
    const mockEmptyOrders = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEmptyOrders),
    })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument()
      expect(screen.getByText('You haven\'t placed any orders yet. Start shopping to see your orders here!')).toBeInTheDocument()
      expect(screen.getByText('Start Shopping')).toBeInTheDocument()
    })
  })

  it('should handle error state', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Orders')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    const mockOrders = {
      data: [
        {
          id: 'order123',
          status: 'PAID',
          total: 99.99,
          createdAt: '2024-01-15T10:00:00Z',
          items: [],
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders),
    })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    // Test pagination click
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders?page=2&limit=10')
    })
  })

  it('should display correct status icons and colors', async () => {
    const mockOrders = {
      data: [
        {
          id: 'order1',
          status: 'PENDING',
          total: 50.00,
          createdAt: '2024-01-15T10:00:00Z',
          items: [],
        },
        {
          id: 'order2',
          status: 'FULFILLED',
          total: 75.00,
          createdAt: '2024-01-14T10:00:00Z',
          items: [],
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders),
    })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument()
      expect(screen.getByText('FULFILLED')).toBeInTheDocument()
    })
  })

  it('should show retry functionality on error', async () => {
    ;(global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }),
      })

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument()
    })
  })
})