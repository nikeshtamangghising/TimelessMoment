import Head from 'next/head'
import { Product } from '@/types'

interface AdvancedSEOProps {
  title: string
  description: string
  canonicalUrl: string
  keywords?: string[]
  ogImage?: string
  productData?: Product & {
    category?: {
      name: string
      slug: string
    }
    brand?: {
      name: string
    }
    reviews?: Array<{
      rating: number
      author: string
      content: string
      createdAt: string
    }>
  }
  breadcrumbs?: Array<{
    name: string
    url: string
  }>
  organizationData?: {
    name: string
    url: string
    logo: string
    sameAs: string[]
  }
}

export default function AdvancedSEO({
  title,
  description,
  canonicalUrl,
  keywords = [],
  ogImage,
  productData,
  breadcrumbs,
  organizationData
}: AdvancedSEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://timeless-shop.com'
  const defaultOgImage = `${siteUrl}/og-image.jpg`
  const finalOgImage = ogImage || (productData?.images?.[0]) || defaultOgImage

  // Generate JSON-LD structured data
  const generateStructuredData = () => {
    const structuredData: any[] = []

    // Organization Schema
    if (organizationData) {
      structuredData.push({
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: organizationData.name,
        url: organizationData.url,
        logo: {
          "@type": "ImageObject",
          url: organizationData.logo
        },
        sameAs: organizationData.sameAs
      })
    }

    // Website Schema
    structuredData.push({
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: organizationData?.name || "Timeless Shop",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    })

    // Product Schema (if product data is provided)
    if (productData) {
      const productSchema: any = {
        "@type": "Product",
        "@id": `${siteUrl}/products/${productData.slug}/#product`,
        name: productData.name,
        description: productData.description,
        image: productData.images,
        sku: productData.sku || productData.id,
        brand: productData.brand ? {
          "@type": "Brand",
          name: productData.brand.name
        } : undefined,
        category: productData.category?.name,
        offers: {
          "@type": "Offer",
          price: productData.discountPrice || productData.price,
          priceCurrency: productData.currency || "USD",
          availability: productData.inventory > 0 
            ? "https://schema.org/InStock" 
            : "https://schema.org/OutOfStock",
          url: `${siteUrl}/products/${productData.slug}`,
          seller: {
            "@type": "Organization",
            name: organizationData?.name || "Timeless Shop"
          }
        }
      }

      // Add aggregateRating if reviews exist
      if (productData.ratingAvg && productData.ratingCount > 0) {
        productSchema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: productData.ratingAvg,
          reviewCount: productData.ratingCount,
          bestRating: 5,
          worstRating: 1
        }
      }

      // Add individual reviews
      if (productData.reviews && productData.reviews.length > 0) {
        productSchema.review = productData.reviews.map(review => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: review.author
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1
          },
          reviewBody: review.content,
          datePublished: review.createdAt
        }))
      }

      structuredData.push(productSchema)
    }

    // Breadcrumb Schema
    if (breadcrumbs && breadcrumbs.length > 1) {
      structuredData.push({
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: `${siteUrl}${crumb.url}`
        }))
      })
    }

    return {
      "@context": "https://schema.org",
      "@graph": structuredData
    }
  }

  const structuredData = generateStructuredData()

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${siteUrl}${canonicalUrl}`} />
      
      {/* Keywords */}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={productData ? "product" : "website"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={`${siteUrl}${canonicalUrl}`} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={organizationData?.name || "Timeless Shop"} />

      {/* Product-specific Open Graph */}
      {productData && (
        <>
          <meta property="product:price:amount" content={String(productData.discountPrice || productData.price)} />
          <meta property="product:price:currency" content={productData.currency || "USD"} />
          <meta property="product:availability" content={productData.inventory > 0 ? "in stock" : "out of stock"} />
          {productData.brand && (
            <meta property="product:brand" content={productData.brand.name} />
          )}
          {productData.category && (
            <meta property="product:category" content={productData.category.name} />
          )}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="format-detection" content="telephone=no" />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  )
}