import { Inter, Roboto_Mono, Playfair_Display } from 'next/font/google'

// Primary font - Inter for body text
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
})

// Monospace font - for code and technical content
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false, // Only load when needed
  fallback: [
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
})

// Display font - for headings and special text
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  preload: false, // Only load when needed
  fallback: [
    'Georgia',
    'Times New Roman',
    'serif',
  ],
})

// Font loading optimization
export const fontOptimization = {
  // Critical fonts that should be preloaded
  critical: [inter],
  
  // Non-critical fonts that can be loaded later
  nonCritical: [robotoMono, playfairDisplay],
  
  // Font display strategy
  display: 'swap' as const,
  
  // Preconnect to Google Fonts
  preconnectUrls: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
}

// Generate font CSS variables
export function getFontVariables(): string {
  return [
    inter.variable,
    robotoMono.variable,
    playfairDisplay.variable,
  ].join(' ')
}

// Font preloading utility
export function preloadFonts(): void {
  if (typeof document === 'undefined') return

  // Preconnect to Google Fonts
  fontOptimization.preconnectUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
}

// Font loading detection
export function detectFontLoading(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    if ('fonts' in document) {
      // Use Font Loading API if available
      document.fonts.ready.then(() => {
        resolve()
      })
    } else {
      // Fallback for older browsers
      setTimeout(resolve, 3000) // Assume fonts are loaded after 3 seconds
    }
  })
}

// Font optimization metrics
export function measureFontLoadingPerformance(): void {
  if (typeof window === 'undefined' || !('fonts' in document)) return

  const startTime = performance.now()

  document.fonts.ready.then(() => {
    const loadTime = performance.now() - startTime
    
    // Log font loading performance
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'font_load_time', {
        event_category: 'Performance',
        value: Math.round(loadTime),
        non_interaction: true,
      })
    }
  })
}

// Initialize font optimization
if (typeof window !== 'undefined') {
  // Preload fonts
  preloadFonts()
  
  // Measure font loading performance in development
  if (process.env.NODE_ENV === 'development') {
    measureFontLoadingPerformance()
  }
}