import { Metadata } from 'next';
import { Product } from '@/types';

interface MetadataConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock';
}

const DEFAULT_METADATA = {
  siteName: 'E-Commerce Platform',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@ecommerce',
};

export function generateMetadata(config: MetadataConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = DEFAULT_METADATA.defaultImage,
    url,
    type = 'website',
    price,
    currency = 'NPR',
    availability = 'in_stock',
  } = config;

  const fullTitle = `${title} | ${DEFAULT_METADATA.siteName}`;
  const fullUrl = url ? `${DEFAULT_METADATA.siteUrl}${url}` : DEFAULT_METADATA.siteUrl;
  const imageUrl = image.startsWith('http') ? image : `${DEFAULT_METADATA.siteUrl}${image}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: DEFAULT_METADATA.siteName }],
    creator: DEFAULT_METADATA.siteName,
    publisher: DEFAULT_METADATA.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: type === 'product' ? 'website' : type,
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: DEFAULT_METADATA.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      creator: DEFAULT_METADATA.twitterHandle,
      images: [imageUrl],
    },
    alternates: {
      canonical: fullUrl,
    },
  };

  // Add product-specific metadata for structured data
  if (type === 'product' && price) {
    metadata.other = {
      'product:price:amount': price.toString(),
      'product:price:currency': currency,
      'product:availability': availability,
    };
  }

  return metadata;
}

export function generateProductMetadata(product: Product): Metadata {
  const categoryName = (product as any)?.category?.name ?? (product as any)?.category;
  const keywords = [
    product.name,
    categoryName,
    'buy online',
    'e-commerce',
    ...(product.description?.split(' ').slice(0, 5) || []),
  ].filter(Boolean) as string[];

  return generateMetadata({
    title: product.name,
    description: product.description || `Buy ${product.name} online. High quality products at great prices.`,
    keywords,
    image: product.images?.[0] || DEFAULT_METADATA.defaultImage,
    url: `/products/${product.slug}`,
    type: 'product',
    price: product.price,
    availability: product.inventory > 0 ? 'in_stock' : 'out_of_stock',
  });
}

export function generateCategoryMetadata(category: string, productCount: number): Metadata {
  const title = `${category} Products`;
  const description = `Shop our collection of ${category.toLowerCase()} products. ${productCount} items available with fast shipping.`;
  
  return generateMetadata({
    title,
    description,
    keywords: [category, 'products', 'buy online', 'e-commerce', 'shop'],
    url: `/categories/${category.toLowerCase()}`,
  });
}

export function generateHomeMetadata(): Metadata {
  return generateMetadata({
    title: 'Home',
    description: 'Discover amazing products at unbeatable prices. Fast shipping, secure checkout, and excellent customer service.',
    keywords: ['e-commerce', 'online shopping', 'products', 'buy online', 'fast shipping'],
    url: '/',
  });
}

export function generateSearchMetadata(query: string, resultCount: number): Metadata {
  const title = `Search Results for "${query}"`;
  const description = `Found ${resultCount} products matching "${query}". Shop now with fast shipping and secure checkout.`;
  
  return generateMetadata({
    title,
    description,
    keywords: [query, 'search', 'products', 'buy online'],
    url: `/search?q=${encodeURIComponent(query)}`,
  });
}