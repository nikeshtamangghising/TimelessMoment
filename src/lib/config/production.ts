// Production configuration settings

export const productionConfig = {
  // Database settings
  database: {
    connectionPoolSize: 20,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    ssl: true,
  },

  // Cache settings
  cache: {
    defaultTtl: 300, // 5 minutes
    longTtl: 3600, // 1 hour
    shortTtl: 60, // 1 minute
    veryLongTtl: 86400, // 24 hours
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Security settings
  security: {
    bcryptRounds: 12,
    jwtExpiresIn: '7d',
    sessionMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    csrfProtection: true,
    helmetOptions: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
          connectSrc: ["'self'", "https://api.stripe.com"],
          frameSrc: ["'self'", "https://js.stripe.com"],
        },
      },
    },
  },

  // Email settings
  email: {
    rateLimitPerHour: 100,
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    templates: {
      orderConfirmation: 'order-confirmation',
      passwordReset: 'password-reset',
      welcomeEmail: 'welcome',
      orderStatusUpdate: 'order-status-update',
    },
  },

  // Payment settings
  payment: {
    stripe: {
      webhookTolerance: 300, // 5 minutes
      captureMethod: 'automatic',
      confirmationMethod: 'automatic',
    },
  },

  // File upload settings
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    imageOptimization: {
      quality: 80,
      formats: ['webp', 'jpeg'],
      sizes: [400, 800, 1200, 1600],
    },
  },

  // Monitoring settings
  monitoring: {
    errorSampleRate: 1.0, // 100% in production
    performanceSampleRate: 0.1, // 10% for performance
    enableTracing: true,
    enableProfiling: false, // Usually disabled in production
  },

  // Feature flags
  features: {
    enableAnalytics: true,
    enableCaching: true,
    enableCompression: true,
    enableImageOptimization: true,
    enableServiceWorker: true,
    enablePWA: true,
  },

  // API settings
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },
  },

  // SEO settings
  seo: {
    enableSitemap: true,
    sitemapChangeFreq: 'daily',
    sitemapPriority: 0.8,
    enableRobotsTxt: true,
    enableStructuredData: true,
  },

  // Performance settings
  performance: {
    enableISR: true,
    isrRevalidate: 3600, // 1 hour
    enableStaticOptimization: true,
    enableBundleAnalyzer: false, // Only enable when needed
    enableSourceMaps: false, // Disabled in production for security
  },

  // Logging settings
  logging: {
    level: 'info',
    enableConsole: false, // Use external logging service in production
    enableFile: false,
    enableRemote: true,
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
    ],
  },
}

// Environment-specific overrides
export const getProductionConfig = () => {
  const config = { ...productionConfig }

  // Override based on environment variables
  if (process.env.ENABLE_DEBUG === 'true') {
    config.logging.level = 'debug'
    config.logging.enableConsole = true
  }

  if (process.env.DISABLE_CACHING === 'true') {
    config.features.enableCaching = false
  }

  if (process.env.ENABLE_PROFILING === 'true') {
    config.monitoring.enableProfiling = true
  }

  return config
}

export default productionConfig