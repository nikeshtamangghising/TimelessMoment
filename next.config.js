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
    }

    return config;
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  // React 18 specific optimizations
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
