import { render } from '@testing-library/react'
import StructuredData from '@/components/seo/structured-data'

describe('StructuredData Component', () => {
  it('should render structured data script tag', () => {
    const testData = {
      '@type': 'Organization',
      name: 'Test Organization',
      url: 'https://example.com',
    }

    const { container } = render(<StructuredData data={testData} />)
    
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
    
    const scriptContent = script?.innerHTML
    expect(scriptContent).toBeTruthy()
    
    const parsedData = JSON.parse(scriptContent!)
    expect(parsedData['@context']).toBe('https://schema.org')
    expect(parsedData['@type']).toBe('Organization')
    expect(parsedData.name).toBe('Test Organization')
    expect(parsedData.url).toBe('https://example.com')
  })

  it('should handle complex nested data', () => {
    const complexData = {
      '@type': 'Product',
      name: 'Test Product',
      offers: {
        '@type': 'Offer',
        price: 99.99,
        priceCurrency: 'USD',
      },
      brand: {
        '@type': 'Brand',
        name: 'Test Brand',
      },
    }

    const { container } = render(<StructuredData data={complexData} />)
    
    const script = container.querySelector('script[type="application/ld+json"]')
    const scriptContent = script?.innerHTML
    const parsedData = JSON.parse(scriptContent!)
    
    expect(parsedData.offers).toEqual({
      '@type': 'Offer',
      price: 99.99,
      priceCurrency: 'USD',
    })
    expect(parsedData.brand).toEqual({
      '@type': 'Brand',
      name: 'Test Brand',
    })
  })

  it('should handle array data (graph format)', () => {
    const graphData = {
      '@graph': [
        { '@type': 'Organization', name: 'Org 1' },
        { '@type': 'WebSite', name: 'Site 1' },
      ],
    }

    const { container } = render(<StructuredData data={graphData} />)
    
    const script = container.querySelector('script[type="application/ld+json"]')
    const scriptContent = script?.innerHTML
    const parsedData = JSON.parse(scriptContent!)
    
    expect(parsedData['@graph']).toHaveLength(2)
    expect(parsedData['@graph'][0]['@type']).toBe('Organization')
    expect(parsedData['@graph'][1]['@type']).toBe('WebSite')
  })
})