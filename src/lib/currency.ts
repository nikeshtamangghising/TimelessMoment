/**
 * Currency configuration and utilities
 */

export const CURRENCIES = {
  NPR: {
    code: 'NPR',
    symbol: '₹',
    name: 'Nepalese Rupee',
    locale: 'ne-NP',
    defaultLocale: 'en-NP', // fallback for better number formatting
    decimals: 2,
    freeShippingThreshold: 200, // NPR 200 minimum for free shipping
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
    freeShippingThreshold: 75,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'en-EU',
    decimals: 2,
    freeShippingThreshold: 65,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2,
    freeShippingThreshold: 55,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    decimals: 2,
    freeShippingThreshold: 5000,
  }
} as const

export type CurrencyCode = keyof typeof CURRENCIES
export type CurrencyConfig = typeof CURRENCIES[CurrencyCode]

// Default currency
export const DEFAULT_CURRENCY: CurrencyCode = 'NPR'

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: string = DEFAULT_CURRENCY): CurrencyConfig {
  return CURRENCIES[currency as CurrencyCode] || CURRENCIES[DEFAULT_CURRENCY]
}

/**
 * Format currency amount with proper NPR formatting
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options?: {
    showSymbol?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  const config = getCurrencyConfig(currency)
  const { showSymbol = true, minimumFractionDigits, maximumFractionDigits } = options || {}

  try {
    // For NPR, we'll use custom formatting since Intl doesn't handle NPR well in all browsers
    if (currency === 'NPR') {
      const formattedNumber = new Intl.NumberFormat('en-NP', {
        minimumFractionDigits: minimumFractionDigits ?? config.decimals,
        maximumFractionDigits: maximumFractionDigits ?? config.decimals,
      }).format(amount)

      return showSymbol ? `${config.symbol} ${formattedNumber}` : formattedNumber
    }

    // For other currencies, use standard Intl formatting
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: minimumFractionDigits ?? config.decimals,
      maximumFractionDigits: maximumFractionDigits ?? config.decimals,
    })

    return formatter.format(amount)
  } catch (error) {
    console.warn(`Currency formatting error for ${currency}:`, error)
    
    // Fallback formatting
    const formattedNumber = amount.toFixed(config.decimals)
    return showSymbol ? `${config.symbol} ${formattedNumber}` : formattedNumber
  }
}

/**
 * Format currency amount without symbol (for calculations)
 */
export function formatCurrencyNumber(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  decimals?: number
): string {
  const config = getCurrencyConfig(currency)
  return amount.toFixed(decimals ?? config.decimals)
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return getCurrencyConfig(currency).symbol
}

/**
 * Get free shipping threshold for currency
 */
export function getFreeShippingThreshold(currency: string = DEFAULT_CURRENCY): number {
  return getCurrencyConfig(currency).freeShippingThreshold
}

/**
 * Convert amount between currencies (placeholder for future implementation)
 * For now, returns the same amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // TODO: Implement actual currency conversion using exchange rates API
  // For now, return the same amount
  if (fromCurrency === toCurrency) {
    return amount
  }
  
  // Basic conversion rates (should be replaced with real-time rates)
  const conversionRates: { [key: string]: { [key: string]: number } } = {
    'USD': { 'NPR': 133, 'EUR': 0.85, 'GBP': 0.73, 'INR': 83 },
    'NPR': { 'USD': 0.0075, 'EUR': 0.0064, 'GBP': 0.0055, 'INR': 0.62 },
    'EUR': { 'USD': 1.18, 'NPR': 157, 'GBP': 0.86, 'INR': 98 },
    'GBP': { 'USD': 1.37, 'NPR': 182, 'EUR': 1.16, 'INR': 114 },
    'INR': { 'USD': 0.012, 'NPR': 1.61, 'EUR': 0.010, 'GBP': 0.0088 },
  }
  
  const rate = conversionRates[fromCurrency]?.[toCurrency] || 1
  return amount * rate
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces, then parse
  const cleaned = currencyString.replace(/[₹$€£,\s]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return currency in CURRENCIES
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES)
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currency: string = DEFAULT_CURRENCY
): string {
  if (minPrice === maxPrice) {
    return formatCurrency(minPrice, currency)
  }
  
  return `${formatCurrency(minPrice, currency)} - ${formatCurrency(maxPrice, currency)}`
}

/**
 * Get compact currency format (K, M, B suffixes)
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const config = getCurrencyConfig(currency)
  
  if (amount >= 1000000000) {
    return `${config.symbol} ${(amount / 1000000000).toFixed(1)}B`
  } else if (amount >= 1000000) {
    return `${config.symbol} ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `${config.symbol} ${(amount / 1000).toFixed(1)}K`
  }
  
  return formatCurrency(amount, currency)
}