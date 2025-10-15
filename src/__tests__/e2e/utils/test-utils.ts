import { Page, expect } from '@playwright/test'

// Test user credentials
export const TEST_USERS = {
  customer: {
    email: 'test-customer@example.com',
    password: 'password123',
    name: 'Test Customer',
  },
  admin: {
    email: 'test-admin@example.com',
    password: 'password123',
    name: 'Test Admin',
  },
}

// Test data
export const TEST_PRODUCTS = {
  electronics: {
    name: 'Test Laptop',
    category: 'Electronics',
    price: 999.99,
  },
  clothing: {
    name: 'Test T-Shirt',
    category: 'Clothing',
    price: 29.99,
  },
}

// Authentication helpers
export async function loginAsCustomer(page: Page) {
  await page.goto('/auth/signin')
  await page.fill('[name="email"]', TEST_USERS.customer.email)
  await page.fill('[name="password"]', TEST_USERS.customer.password)
  await page.click('button[type="submit"]')
  
  // Wait for redirect to home page
  await page.waitForURL('/')
  
  // Verify login success
  await expect(page.locator('text=Test Customer')).toBeVisible()
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/signin')
  await page.fill('[name="email"]', TEST_USERS.admin.email)
  await page.fill('[name="password"]', TEST_USERS.admin.password)
  await page.click('button[type="submit"]')
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin')
  
  // Verify login success
  await expect(page.locator('text=Test Admin')).toBeVisible()
}

export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]')
  
  // Click logout
  await page.click('text=Logout')
  
  // Wait for redirect to home page
  await page.waitForURL('/')
}

// Navigation helpers
export async function navigateToProducts(page: Page) {
  await page.click('text=Products')
  await page.waitForURL('/products')
  await expect(page.locator('h1')).toContainText('Products')
}

export async function navigateToCart(page: Page) {
  await page.click('[data-testid="cart-button"]')
  await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible()
}

export async function navigateToCheckout(page: Page) {
  await navigateToCart(page)
  await page.click('text=Checkout')
  await page.waitForURL('/checkout')
}

// Product helpers
export async function addProductToCart(page: Page, productName: string) {
  // Go to products page
  await navigateToProducts(page)
  
  // Find and click on the product
  await page.click(`text=${productName}`)
  
  // Add to cart
  await page.click('text=Add to Cart')
  
  // Wait for success message or cart update
  await expect(page.locator('text=Added to cart')).toBeVisible({ timeout: 5000 })
}

export async function searchForProduct(page: Page, searchTerm: string) {
  await page.fill('[data-testid="search-input"]', searchTerm)
  await page.press('[data-testid="search-input"]', 'Enter')
  await page.waitForLoadState('networkidle')
}

// Form helpers
export async function fillCheckoutForm(page: Page, customerInfo: {
  firstName: string
  lastName: string
  email: string
  address: string
  city: string
  postalCode: string
}) {
  await page.fill('[name="firstName"]', customerInfo.firstName)
  await page.fill('[name="lastName"]', customerInfo.lastName)
  await page.fill('[name="email"]', customerInfo.email)
  await page.fill('[name="address"]', customerInfo.address)
  await page.fill('[name="city"]', customerInfo.city)
  await page.fill('[name="postalCode"]', customerInfo.postalCode)
}

// Wait helpers
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

export async function waitForApiResponse(page: Page, url: string) {
  return page.waitForResponse(response => 
    response.url().includes(url) && response.status() === 200
  )
}

// Assertion helpers
export async function expectProductInCart(page: Page, productName: string) {
  await navigateToCart(page)
  await expect(page.locator(`[data-testid="cart-item"]:has-text("${productName}")`)).toBeVisible()
}

export async function expectCartItemCount(page: Page, count: number) {
  await expect(page.locator('[data-testid="cart-count"]')).toContainText(count.toString())
}

export async function expectOrderTotal(page: Page, total: string) {
  await expect(page.locator('[data-testid="order-total"]')).toContainText(total)
}

// Screenshot helpers
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  })
}

// Performance helpers
export async function measurePageLoadTime(page: Page, url: string) {
  const startTime = Date.now()
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  const endTime = Date.now()
  return endTime - startTime
}

// Accessibility helpers
export async function checkAccessibility(page: Page) {
  // Check for basic accessibility issues
  const missingAltImages = await page.locator('img:not([alt])').count()
  const missingLabels = await page.locator('input:not([aria-label]):not([aria-labelledby])').count()
  
  expect(missingAltImages).toBe(0)
  expect(missingLabels).toBe(0)
}

// Mobile helpers
export async function testMobileResponsiveness(page: Page) {
  // Test different viewport sizes
  const viewports = [
    { width: 375, height: 667 }, // iPhone SE
    { width: 414, height: 896 }, // iPhone 11
    { width: 768, height: 1024 }, // iPad
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(500) // Allow layout to settle
    
    // Check that navigation is accessible
    const navButton = page.locator('[data-testid="mobile-menu-button"]')
    if (await navButton.isVisible()) {
      await navButton.click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      await navButton.click() // Close menu
    }
  }
}

// Error handling helpers
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  // After test execution, check for errors
  return () => {
    expect(errors).toHaveLength(0)
  }
}

// Network helpers
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

export async function simulateNetworkError(page: Page, url: string) {
  await page.route(url, route => {
    route.abort('failed')
  })
}

// Database helpers (for test data setup)
export async function createTestProduct(page: Page, product: any) {
  const response = await page.request.post('/api/products', {
    data: product,
    headers: {
      'Authorization': 'Bearer test-admin-token' // You'd need proper auth
    }
  })
  
  expect(response.ok()).toBeTruthy()
  return response.json()
}

export async function cleanupTestData(page: Page) {
  // Clean up any test data created during tests
  try {
    await page.request.delete('/api/test/cleanup')
  } catch (error) {
  }
}

// Custom matchers
export function expectToBeWithinRange(actual: number, min: number, max: number) {
  expect(actual).toBeGreaterThanOrEqual(min)
  expect(actual).toBeLessThanOrEqual(max)
}