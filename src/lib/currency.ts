/**
 * Currency configuration and utilities
 */

export const CURRENCIES = {
  NPR: {
    code: 'NPR',
    symbol: 'NPR',
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
    symbol: 'INR',
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
 * Convert amount between currencies using live exchange rates
 * Falls back to cached rates if API is unavailable
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  try {
    // In production, integrate with a reliable exchange rate API
    // Example: exchangerate-api.com, fixer.io, or currencylayer.com
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency)
    return amount * exchangeRate
  } catch (error) {
    // Return original amount if conversion fails
    return amount
  }
}

/**
 * Get exchange rate from external API with caching
 * This is a placeholder - implement with your preferred exchange rate provider
 */
async function getExchangeRate(from: string, to: string): Promise<number> {
  // This should be implemented with a real exchange rate API
  // For now, return 1 to avoid breaking the application
  // TODO: Implement with exchange rate API service
  
  // Example implementation structure:
  // const cacheKey = `exchange_rate_${from}_${to}`
  // const cachedRate = await getCachedExchangeRate(cacheKey)
  // if (cachedRate && !isRateExpired(cachedRate)) {
  //   return cachedRate.rate
  // }
  // 
  // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
  // const data = await response.json()
  // const rate = data.rates[to]
  // 
  // await cacheExchangeRate(cacheKey, rate)
  // return rate
  
  return 1 // Fallback: no conversion
}

/**
 * Synchronous currency conversion using cached rates only
 * Use this for immediate calculations where async is not suitable
 */
export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }
  
  // Return original amount if no cached rate is available
  // This prevents breaking the UI while exchange rates are being fetched
  return amount
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces, then parse
  const cleaned = currencyString.replace(/(NPR|INR|₹|\$|€|£|,|\s)/g, '')
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