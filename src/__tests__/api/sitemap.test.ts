import { GET as getSitemapInfo, POST as regenerateSitemap } from '@/app/api/sitemap/regenerate/route'
import { GET as getSubmissionInfo, POST as submitSitemap } from '@/app/api/sitemap/submit/route'
import { getServerSession } from 'next-auth'
import { generateSitemap } from '@/lib/sitemap'
import { submitSitemapToSearchEngines, pingSitemapUpdate } from '@/lib/search-engine-submission'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/sitemap')
jest.mock('@/lib/search-engine-submission')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGenerateSitemap = generateSitemap as jest.MockedFunction<typeof generateSitemap>
const mockSubmitSitemapToSearchEngines = submitSitemapToSearchEngines as jest.MockedFunction<typeof submitSitemapToSearchEngines>
const mockPingSitemapUpdate = pingSitemapUpdate as jest.MockedFunction<typeof pingSitemapUpdate>

describe('Sitemap API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/sitemap/regenerate', () => {
    describe('GET', () => {
      it('should return sitemap info', async () => {
        const mockSitemap = [
          { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
          { url: 'https://example.com/products', lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 0.9 },
        ]
        mockGenerateSitemap.mockResolvedValue(mockSitemap)

        const response = await getSitemapInfo()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.entries).toBe(2)
        expect(data.lastGenerated).toBeTruthy()
        expect(data.sitemapUrl).toContain('/sitemap.xml')
      })

      it('should handle sitemap generation errors', async () => {
        mockGenerateSitemap.mockRejectedValue(new Error('Database error'))

        const response = await getSitemapInfo()
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to get sitemap info')
      })
    })

    describe('POST', () => {
      it('should regenerate sitemap for admin users', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
        } as any)

        const mockSitemap = [
          { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
        ]
        mockGenerateSitemap.mockResolvedValue(mockSitemap)

        const request = new Request('http://localhost:3000/api/sitemap/regenerate', {
          method: 'POST',
        })

        const response = await regenerateSitemap(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Sitemap regenerated successfully')
        expect(data.entries).toBe(1)
        expect(data.timestamp).toBeTruthy()
      })

      it('should reject non-admin users', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: '1', email: 'user@example.com', role: 'CUSTOMER' },
        } as any)

        const request = new Request('http://localhost:3000/api/sitemap/regenerate', {
          method: 'POST',
        })

        const response = await regenerateSitemap(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized. Admin access required.')
      })

      it('should reject unauthenticated users', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const request = new Request('http://localhost:3000/api/sitemap/regenerate', {
          method: 'POST',
        })

        const response = await regenerateSitemap(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized. Admin access required.')
      })
    })
  })

  describe('/api/sitemap/submit', () => {
    describe('GET', () => {
      it('should return submission info', async () => {
        const response = await getSubmissionInfo()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.sitemapUrl).toContain('/sitemap.xml')
        expect(data.robotsUrl).toContain('/robots.txt')
        expect(data.searchEngines.google).toBeTruthy()
        expect(data.searchEngines.bing).toBeTruthy()
      })
    })

    describe('POST', () => {
      it('should submit sitemap for admin users', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
        } as any)

        const mockResults = [
          { searchEngine: 'Google', success: true, message: 'Success', submittedAt: new Date() },
          { searchEngine: 'Bing', success: true, message: 'Success', submittedAt: new Date() },
        ]
        mockSubmitSitemapToSearchEngines.mockResolvedValue(mockResults)

        const request = new Request('http://localhost:3000/api/sitemap/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        })

        const response = await submitSitemap(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Sitemap submit completed')
        expect(data.results).toHaveLength(2)
      })

      it('should ping sitemap updates', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
        } as any)

        const mockResults = [
          { searchEngine: 'Google', success: true, message: 'Pinged', submittedAt: new Date() },
        ]
        mockPingSitemapUpdate.mockResolvedValue(mockResults)

        const request = new Request('http://localhost:3000/api/sitemap/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping' }),
        })

        const response = await submitSitemap(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Sitemap ping completed')
        expect(mockPingSitemapUpdate).toHaveBeenCalled()
      })

      it('should reject non-admin users', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: '1', email: 'user@example.com', role: 'CUSTOMER' },
        } as any)

        const request = new Request('http://localhost:3000/api/sitemap/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit' }),
        })

        const response = await submitSitemap(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized. Admin access required.')
      })
    })
  })
})