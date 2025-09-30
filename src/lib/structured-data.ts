import { Product } from '@/types';

interface Organization {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

interface WebSite {
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

interface ProductStructuredData {
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
    seller: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
  };
}

interface BreadcrumbList {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

const SITE_CONFIG = {
  name: 'E-Commerce Platform',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
  logo: '/images/logo.png',
  socialMedia: [
    'https://facebook.com/ecommerce',
    'https://twitter.com/ecommerce',
    'https://instagram.com/ecommerce',
  ],
};

export function generateOrganizationSchema(): Organization {
  return {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    sameAs: SITE_CONFIG.socialMedia,
  };
}

export function generateWebSiteSchema(): WebSite {
  return {
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProductSchema(product: Product): ProductStructuredData {
  const availability = product.inventory > 0
    ? 'https://schema.org/InStock' 
    : 'https://schema.org/OutOfStock';

  return {
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.[0] ? [`${SITE_CONFIG.url}${product.images[0]}`] : undefined,
    sku: product.id.toString(),
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability,
      url: `${SITE_CONFIG.url}/products/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
      },
    },
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_CONFIG.url}${crumb.url}`,
    })),
  };
}

export function generateStructuredDataScript(data: any): string {
  const structuredData = {
    '@context': 'https://schema.org',
    ...data,
  };

  return JSON.stringify(structuredData, null, 2);
}

// Helper function to combine multiple schemas
export function combineSchemas(...schemas: any[]): any {
  if (schemas.length === 1) {
    return {
      '@context': 'https://schema.org',
      ...schemas[0],
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}