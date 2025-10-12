/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore TypeScript build errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint build errors
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Fixes for potential webpack issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Optimize chunk loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            admin: {
              test: /[\\/]src[\\/]components[\\/]admin[\\/]/,
              name: 'admin',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
    // Reduce preload warnings by optimizing resource loading
    optimizeCss: true,
    // Disable automatic preloading for better control
    disableOptimizedLoading: false,
  },
  // React 18 specific optimizations
  reactStrictMode: true,
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
