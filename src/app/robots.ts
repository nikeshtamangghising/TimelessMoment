import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/cart/',
          '/orders/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/products/', '/categories/'],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
          '/cart/',
          '/orders/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}