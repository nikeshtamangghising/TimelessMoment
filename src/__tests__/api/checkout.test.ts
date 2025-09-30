import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/checkout/create-payment-intent/route'

// Mock Stripe
const mockCreatePaymentIntent = jest.fn()
jest.mock('@/lib/stripe', () => ({
  createPaymentIntent: mockCreatePaymentIntent,
}))

// Mock product repository
const mockProductRepository = {
  findById: jest.fn(),
}
jest.mock('@/lib/product-repository', () => ({
  productRepository: mockProductRepository,
}))

// Mock auth middleware
jest.mock('@/lib/auth-middleware', () => ({
  createAuthHandler: (handler: any) => handler,
}))

describe('/api/checkout/create-payment-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create payment intent successfully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      inventory: 10,
      isActive: true,
    }

    const mockPaymentIntent = {
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
      amount: 11923, // $119.23 in cents
      currency: 'usd',
    }

    mockProductRepository.findById.mockResolvedValue(mockProduct)
    mockCreatePaymentIntent.mockResolvedValue(mockPaymentIntent)

    const requestBody = {
      items: [
        { productId: '1', quantity: 1 }
      ]
    }

    const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.clientSecret).toBe('pi_test123_secret')
    expect(data.paymentIntentId).toBe('pi_test123')
    expect(data.amount).toBe(11923)
    expect(data.currency).toBe('usd')
    expect(data.summary).toBeDefined()
  })

  it('should return 400 for invalid request data', async () => {
    const requestBody = {
      items: [] // Empty items array
    }

    const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
    expect(data.details).toBeDefined()
  })

  it('should return 404 for non-existent product', async () => {
    mockProductRepository.findById.mockResolvedValue(null)

    const requestBody = {
      items: [
        { productId: 'nonexistent', quantity: 1 }
      ]
    }

    const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Product nonexistent not found')
  })

  it('should return 400 for inactive product', async () => {
    const inactiveProduct = {
      id: '1',
      name: 'Inactive Product',
      price: 99.99,
      inventory: 10,
      isActive: false,
    }

    mockProductRepository.findById.mockResolvedValue(inactiveProduct)

    const requestBody = {
      items: [
        { productId: '1', quantity: 1 }
      ]
    }

    const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Product Inactive Product is no longer available')
  })

  it('should return 400 for insufficient inventory', async () => {
    const lowStockProduct = {
      id: '1',
      name: 'Low Stock Product',
      price: 99.99,
      inventory: 2,
      isActive: true,
    }

    mockProductRepository.findById.mockResolvedValue(lowStockProduct)

    const requestBody = {
      items: [
        { productId: '1', quantity: 5 } // Requesting more than available
      ]
    }

    const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Insufficient inventory for Low Stock Product. Only 2 available')
  })

  it('should handle multiple items correctly', async () => {
    const mockProduct1 = {
      id: '1',
      name: 'Product 1',
      price: 50.00,
      inventory: 10,
      isActive: true,
    }

    const mockProduct2 = {
      id: '2',
      name: 'Product 2',
      price: 75.00,
      inventory: 5,
      isActive: true,
    }

    const mockPaymentIntent = {
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
      amount: 14323, // Total with tax and shipping
      currency: 'usd',
    }

    mockProductRepository.findById
      .mockResolvedValueOnce(mockProduct1)
      .mockResolvedValueOnce(mockProduct2)
    mockCreatePaymentIntent.mockResolvedValue(mockPaymentIntent)

    const requestBody = {
      items: [
        { productId: '1', quantity: 2 }, // $100
        { productId: '2', quantity: 1 }  // $75
      ]
    }

    const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary.itemsCount).toBe(3)
    expect(mockProductRepository.findById).toHaveBeenCalledTimes(2)
  })
})