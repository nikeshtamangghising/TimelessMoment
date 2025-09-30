import {
  submitSitemapToGoogle,
  submitSitemapToBing,
  submitSitemapToSearchEngines,
  pingSitemapUpdate,
  generateSearchConsoleVerificationMeta,
  generateBingVerificationMeta,
} from '@/lib/search-engine-submission'

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

describe('Search Engine Submission', () => {
  describe('submitSitemapToGoogle', () => {
    it('should return success result with submission URL', async () => {
      const result = await submitSitemapToGoogle()

      expect(result.searchEngine).toBe('Google')
      expect(result.success).toBe(true)
      expect(result.message).toContain('https://www.google.com/ping?sitemap=')
      expect(result.message).toContain('https://example.com/sitemap.xml')
      expect(result.submittedAt).toBeInstanceOf(Date)
    })

    it('should handle custom sitemap URL', async () => {
      const customUrl = 'https://custom.com/sitemap.xml'
      const result = await submitSitemapToGoogle(customUrl)

      expect(result.message).toContain(encodeURIComponent(customUrl))
    })
  })

  describe('submitSitemapToBing', () => {
    it('should return success result with submission URL', async () => {
      const result = await submitSitemapToBing()

      expect(result.searchEngine).toBe('Bing')
      expect(result.success).toBe(true)
      expect(result.message).toContain('https://www.bing.com/ping?sitemap=')
      expect(result.message).toContain('https://example.com/sitemap.xml')
      expect(result.submittedAt).toBeInstanceOf(Date)
    })
  })

  describe('submitSitemapToSearchEngines', () => {
    it('should submit to both Google and Bing', async () => {
      const results = await submitSitemapToSearchEngines()

      expect(results).toHaveLength(2)
      expect(results[0].searchEngine).toBe('Google')
      expect(results[1].searchEngine).toBe('Bing')
      expect(results.every(r => r.success)).toBe(true)
    })
  })

  describe('pingSitemapUpdate', () => {
    it('should ping both search engines', async () => {
      const results = await pingSitemapUpdate()

      expect(results).toHaveLength(2)
      expect(results.find(r => r.searchEngine === 'Google')).toBeTruthy()
      expect(results.find(r => r.searchEngine === 'Bing')).toBeTruthy()
      expect(results.every(r => r.success)).toBe(true)
    })

    it('should include ping URLs in messages', async () => {
      const results = await pingSitemapUpdate()

      const googleResult = results.find(r => r.searchEngine === 'Google')
      const bingResult = results.find(r => r.searchEngine === 'Bing')

      expect(googleResult?.message).toContain('https://www.google.com/ping?sitemap=')
      expect(bingResult?.message).toContain('https://www.bing.com/ping?sitemap=')
    })
  })

  describe('generateSearchConsoleVerificationMeta', () => {
    it('should generate Google verification meta tag', () => {
      const verificationCode = 'abc123def456'
      const meta = generateSearchConsoleVerificationMeta(verificationCode)

      expect(meta).toBe(`<meta name="google-site-verification" content="${verificationCode}" />`)
    })
  })

  describe('generateBingVerificationMeta', () => {
    it('should generate Bing verification meta tag', () => {
      const verificationCode = 'xyz789uvw012'
      const meta = generateBingVerificationMeta(verificationCode)

      expect(meta).toBe(`<meta name="msvalidate.01" content="${verificationCode}" />`)
    })
  })
})