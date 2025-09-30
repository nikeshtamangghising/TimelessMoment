import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateStructuredDataScript,
  combineSchemas,
} from '@/lib/structured-data'
import { Product } from '@/types'

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SITE_URL: 'https://example.com'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Structured Data Generation', () => {
  describe('generateOrganizationSchema', () => {
    it('should generate organization schema', () => {
      const schema = generateOrganizationSchema()

      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('E-Commerce Platform')
      expect(schema.url).toBe('https://example.com')
      expect(schema.logo).toBe('https://example.com/images/logo.png')
      expect(schema.sameAs).toEqual([
        'https://facebook.com/ecommerce',
        'https://twitter.com/ecommerce',
        'https://instagram.com/ecommerce',
      ])
    })
  })

  describe('generateWebSiteSchema', () => {
    it('should generate website schema with search action', () => {
      const schema = generateWebSiteSchema()

      expect(schema['@type']).toBe('WebSite')
      expect(schema.name).toBe('E-Commerce Platform')
      expect(schema.url).toBe('https://example.com')
      expect(schema.potentialAction).toEqual({
        '@type': 'SearchAction',
        target: 'https://example.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      })
    })
  })

  describe('generateProductSchema', () => {
    const mockProduct: Product = {
      id: 1,
      name: 'Test Product',
      slug: 'test-product',
      description: 'A great test product',
      price: 99.99,
      category: 'Electronics',
      imageUrl: '/images/test-product.jpg',
      stock: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should generate product schema for in-stock product', () => {
      const schema = generateProductSchema(mockProduct)

      expect(schema['@type']).toBe('Product')
      expect(schema.name).toBe('Test Product')
      expect(schema.description).toBe('A great test product')
      expect(schema.image).toEqual(['https://example.com/images/test-product.jpg'])
      expect(schema.sku).toBe('1')
      expect(schema.brand).toEqual({
        '@type': 'Brand',
        name: 'E-Commerce Platform',
      })
      expect(schema.offers).toEqual({
        '@type': 'Offer',
        price: 99.99,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://example.com/products/test-product',
        seller: {
          '@type': 'Organization',
          name: 'E-Commerce Platform',
        },
      })
    })

    it('should generate product schema for out-of-stock product', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      const schema = generateProductSchema(outOfStockProduct)

      expect(schema.offers.availability).toBe('https://schema.org/OutOfStock')
    })

    it('should handle product without image', () => {
      const productWithoutImage = { ...mockProduct, imageUrl: null }
      const schema = generateProductSchema(productWithoutImage)

      expect(schema.image).toBeUndefined()
    })
  })

  describe('generateBreadcrumbSchema', () => {
    it('should generate breadcrumb schema', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: 'Electronics', url: '/products?category=Electronics' },
        { name: 'Laptop', url: '/products/laptop' },
      ]

      const schema = generateBreadcrumbSchema(breadcrumbs)

      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(4)
      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://example.com/',
      })
      expect(schema.itemListElement[3]).toEqual({
        '@type': 'ListItem',
        position: 4,
        name: 'Laptop',
        item: 'https://example.com/products/laptop',
      })
    })
  })

  describe('generateStructuredDataScript', () => {
    it('should generate JSON-LD script content', () => {
      const data = {
        '@type': 'Organization',
        name: 'Test Org',
      }

      const script = generateStructuredDataScript(data)
      const parsed = JSON.parse(script)

      expect(parsed['@context']).toBe('https://schema.org')
      expect(parsed['@type']).toBe('Organization')
      expect(parsed.name).toBe('Test Org')
    })
  })

  describe('combineSchemas', () => {
    it('should combine single schema with context', () => {
      const schema = { '@type': 'Organization', name: 'Test' }
      const combined = combineSchemas(schema)

      expect(combined['@context']).toBe('https://schema.org')
      expect(combined['@type']).toBe('Organization')
      expect(combined.name).toBe('Test')
    })

    it('should combine multiple schemas into graph', () => {
      const schema1 = { '@type': 'Organization', name: 'Test Org' }
      const schema2 = { '@type': 'WebSite', name: 'Test Site' }
      const combined = combineSchemas(schema1, schema2)

      expect(combined['@context']).toBe('https://schema.org')
      expect(combined['@graph']).toHaveLength(2)
      expect(combined['@graph'][0]).toEqual(schema1)
      expect(combined['@graph'][1]).toEqual(schema2)
    })
  })
})