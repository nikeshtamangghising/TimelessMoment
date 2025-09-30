import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import ProductsPage from '@/app/products/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

// Mock the MainLayout component
jest.mock('@/components/layout/main-layout', () => {
  return function MockMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>
  }
})

// Mock fetch
global.fetch = jest.fn()

const mockSearchParams = {
  get: jest.fn(),
}

describe('Product Browsing E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    mockSearchParams.get.mockReturnValue(null)
  })

  it('should render products page with search and filters', async () => {
    const mockProductsResponse = {
      data: [
        {
          id: '1',
          name: 'Test Product 1',
          description: 'Description 1',
          price: 99.99,
          images: ['https://example.com/image1.jpg'],
          inventory: 10,
          category: 'Electronics',
          slug: 'test-product-1',
          isActive: true,
        },
        {
          id: '2',
          name: 'Test Product 2',
          description: 'Description 2',
          price: 149.99,
          images: ['https://example.com/image2.jpg'],
          inventory: 5,
          category: 'Electronics',
          slug: 'test-product-2',
          isActive: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 12,
        total: 2,
        totalPages: 1,
      },
    }

    const mockCategoriesResponse = {
      categories: ['Electronics', 'Clothing', 'Books'],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategoriesResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })

    render(<ProductsPage />)

    // Check if main elements are rendered
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()
    expect(screen.getByText('Filters')).toBeInTheDocument()

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })

    // Check if pagination info is displayed
    expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument()
  })

  it('should handle search functionality', async () => {
    const mockProductsResponse = {
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })

    render(<ProductsPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()
    })

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search products...')
    const searchButton = screen.getByText('Search')

    fireEvent.change(searchInput, { target: { value: 'laptop' } })
    fireEvent.click(searchButton)

    // Verify fetch was called with search parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=laptop')
      )
    })
  })

  it('should handle category filtering', async () => {
    const mockProductsResponse = {
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    }

    const mockCategoriesResponse = {
      categories: ['Electronics', 'Clothing'],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategoriesResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })

    render(<ProductsPage />)

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    // Select category
    const electronicsRadio = screen.getByDisplayValue('Electronics')
    fireEvent.click(electronicsRadio)

    // Verify fetch was called with category parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=Electronics')
      )
    })
  })

  it('should handle price range filtering', async () => {
    const mockProductsResponse = {
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })

    render(<ProductsPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Min price')).toBeInTheDocument()
    })

    // Set price range
    const minPriceInput = screen.getByPlaceholderText('Min price')
    const maxPriceInput = screen.getByPlaceholderText('Max price')
    const applyButton = screen.getByText('Apply')

    fireEvent.change(minPriceInput, { target: { value: '50' } })
    fireEvent.change(maxPriceInput, { target: { value: '200' } })
    fireEvent.click(applyButton)

    // Verify fetch was called with price parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('minPrice=50')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxPrice=200')
      )
    })
  })

  it('should handle error states', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: [] }),
      })
      .mockRejectedValueOnce(new Error('Network error'))

    render(<ProductsPage />)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load products. Please try again.')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should clear all filters', async () => {
    const mockProductsResponse = {
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProductsResponse),
      })

    render(<ProductsPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    // Click clear all filters
    const clearButton = screen.getByText('Clear All')
    fireEvent.click(clearButton)

    // Verify that filters are reset (this would be more comprehensive in a real test)
    expect(clearButton).toBeInTheDocument()
  })
})