import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { 
  loginAsCustomer, 
  addProductToCart, 
  expectProductInCart,
  TEST_USERS,
  waitForPageLoad 
} from './utils/test-utils'

test.describe('Customer Purchase Flow', () => {
  let homePage: HomePage
  let productsPage: ProductsPage
  let checkoutPage: CheckoutPage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
    productsPage = new ProductsPage(page)
    checkoutPage = new CheckoutPage(page)
    
    // Start from home page
    await homePage.goto()
  })

  test('complete purchase flow as guest user', async ({ page }) => {
    // 1. Browse products
    await homePage.navigateToProducts()
    await productsPage.expectProductsVisible()

    // 2. Search for a product
    await productsPage.searchProducts('laptop')
    await productsPage.waitForProductsToLoad()
    
    // Verify search results
    const productCount = await productsPage.getProductCount()
    expect(productCount).toBeGreaterThan(0)

    // 3. Add product to cart
    await productsPage.addProductToCart('Test Laptop')
    
    // 4. Verify cart contents
    await homePage.openCart()
    await expectProductInCart(page, 'Test Laptop')

    // 5. Proceed to checkout
    await page.click('[data-testid="checkout-button"]')
    await checkoutPage.waitForPageLoad()

    // 6. Fill shipping information
    await checkoutPage.fillShippingInformation({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      address: '123 Test Street',
      city: 'Test City',
      postalCode: '12345',
      country: 'US'
    })

    // 7. Fill payment information (test card)
    await checkoutPage.fillPaymentInformation({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'John Doe'
    })

    // 8. Place order
    await checkoutPage.placeOrder()

    // 9. Verify success
    await checkoutPage.expectSuccessRedirect()
    await expect(page.locator('text=Thank you for your order')).toBeVisible()
  })

  test('complete purchase flow as authenticated user', async ({ page }) => {
    // 1. Login as customer
    await loginAsCustomer(page)

    // 2. Browse and add multiple products
    await homePage.navigateToProducts()
    await productsPage.addProductToCart('Test Laptop')
    await productsPage.addProductToCart('Test Mouse')

    // 3. Verify cart has multiple items
    await homePage.openCart()
    const cartCount = await homePage.getCartItemCount()
    expect(cartCount).toBe(2)

    // 4. Proceed to checkout (shipping info should be pre-filled)
    await page.click('[data-testid="checkout-button"]')
    await checkoutPage.waitForPageLoad()

    // 5. Verify user info is pre-filled
    const emailField = page.locator('[name="email"]')
    await expect(emailField).toHaveValue(TEST_USERS.customer.email)

    // 6. Complete payment
    await checkoutPage.fillPaymentInformation({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'Test Customer'
    })

    await checkoutPage.placeOrder()
    await checkoutPage.expectSuccessRedirect()

    // 7. Verify order appears in user's order history
    await page.goto('/orders')
    await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible()
  })

  test('cart persistence across sessions', async ({ page }) => {
    // 1. Add product to cart as guest
    await homePage.navigateToProducts()
    await productsPage.addProductToCart('Test Laptop')

    // 2. Verify cart has item
    const initialCartCount = await homePage.getCartItemCount()
    expect(initialCartCount).toBe(1)

    // 3. Refresh page
    await page.reload()
    await waitForPageLoad(page)

    // 4. Verify cart still has item
    const persistedCartCount = await homePage.getCartItemCount()
    expect(persistedCartCount).toBe(1)

    // 5. Login and verify cart is maintained
    await loginAsCustomer(page)
    const loggedInCartCount = await homePage.getCartItemCount()
    expect(loggedInCartCount).toBe(1)
  })

  test('product filtering and sorting', async ({ page }) => {
    await homePage.navigateToProducts()

    // 1. Filter by category
    await productsPage.filterByCategory('Electronics')
    await productsPage.expectProductsVisible()

    // 2. Apply price filter
    await productsPage.filterByPriceRange('100', '1000')
    
    // Verify all products are within price range
    const prices = await productsPage.getProductPrices()
    prices.forEach(price => {
      expect(price).toBeGreaterThanOrEqual(100)
      expect(price).toBeLessThanOrEqual(1000)
    })

    // 3. Sort by price (low to high)
    await productsPage.sortBy('price-asc')
    await productsPage.expectPricesSorted('asc')

    // 4. Sort by price (high to low)
    await productsPage.sortBy('price-desc')
    await productsPage.expectPricesSorted('desc')
  })

  test('search functionality', async ({ page }) => {
    await homePage.navigateToProducts()

    // 1. Search for specific product
    await productsPage.searchProducts('laptop')
    
    // 2. Verify search results contain search term
    const productCards = page.locator('[data-testid="product-card"]')
    const count = await productCards.count()
    
    for (let i = 0; i < count; i++) {
      const productName = await productCards.nth(i).locator('[data-testid="product-name"]').textContent()
      expect(productName?.toLowerCase()).toContain('laptop')
    }

    // 3. Test empty search results
    await productsPage.searchProducts('nonexistentproduct123')
    await productsPage.expectNoProductsMessage()

    // 4. Clear search and verify all products return
    await productsPage.searchProducts('')
    await productsPage.expectProductsVisible()
  })

  test('pagination functionality', async ({ page }) => {
    await homePage.navigateToProducts()
    await productsPage.waitForProductsToLoad()

    // Check if pagination is available
    const nextButton = page.locator('[data-testid="next-page"]')
    
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      // 1. Go to next page
      const firstPageProducts = await productsPage.getProductCount()
      await productsPage.goToNextPage()
      
      // 2. Verify different products are shown
      const secondPageProducts = await productsPage.getProductCount()
      expect(secondPageProducts).toBeGreaterThan(0)

      // 3. Go back to first page
      await productsPage.goToPreviousPage()
      const backToFirstPageProducts = await productsPage.getProductCount()
      expect(backToFirstPageProducts).toBe(firstPageProducts)
    } else {
    }
  })

  test('responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // 1. Test home page on mobile
    await homePage.goto()
    await homePage.expectPageLoaded()

    // 2. Test mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      
      // Navigate to products via mobile menu
      await page.click('[data-testid="mobile-nav-products"]')
      await page.waitForURL('/products')
    }

    // 3. Test product browsing on mobile
    await productsPage.expectProductsVisible()
    
    // 4. Test cart on mobile
    await productsPage.addProductToCart('Test Laptop')
    await homePage.openCart()
    
    // Cart should be full-screen on mobile
    const cartSidebar = page.locator('[data-testid="cart-sidebar"]')
    await expect(cartSidebar).toBeVisible()
  })

  test('error handling and recovery', async ({ page }) => {
    // 1. Test network error handling
    await page.route('/api/products', route => route.abort('failed'))
    
    await homePage.navigateToProducts()
    
    // Should show error message
    await expect(page.locator('text=Failed to load products')).toBeVisible()
    
    // Should have retry button
    const retryButton = page.locator('[data-testid="retry-button"]')
    await expect(retryButton).toBeVisible()

    // 2. Test recovery after network is restored
    await page.unroute('/api/products')
    await retryButton.click()
    
    // Products should load successfully
    await productsPage.expectProductsVisible()
  })

  test('accessibility compliance', async ({ page }) => {
    // 1. Test keyboard navigation
    await homePage.goto()
    
    // Tab through navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // Should navigate to products
    
    await page.waitForURL('/products')

    // 2. Test screen reader compatibility
    const productCards = page.locator('[data-testid="product-card"]')
    const firstCard = productCards.first()
    
    // Check for proper ARIA labels
    await expect(firstCard).toHaveAttribute('role', 'article')
    
    // Check for alt text on images
    const productImage = firstCard.locator('img')
    await expect(productImage).toHaveAttribute('alt')

    // 3. Test focus management
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('performance benchmarks', async ({ page }) => {
    // 1. Measure home page load time
    const homeLoadStart = Date.now()
    await homePage.goto()
    await homePage.expectPageLoaded()
    const homeLoadTime = Date.now() - homeLoadStart
    
    expect(homeLoadTime).toBeLessThan(3000) // Should load in under 3 seconds

    // 2. Measure products page load time
    const productsLoadStart = Date.now()
    await homePage.navigateToProducts()
    await productsPage.expectProductsVisible()
    const productsLoadTime = Date.now() - productsLoadStart
    
    expect(productsLoadTime).toBeLessThan(2000) // Should load in under 2 seconds

    // 3. Measure search response time
    const searchStart = Date.now()
    await productsPage.searchProducts('laptop')
    await productsPage.waitForProductsToLoad()
    const searchTime = Date.now() - searchStart
    
    expect(searchTime).toBeLessThan(1000) // Search should respond in under 1 second
  })

  test('cross-browser compatibility', async ({ page, browserName }) => {

    // 1. Basic functionality should work on all browsers
    await homePage.goto()
    await homePage.expectPageLoaded()

    // 2. JavaScript functionality
    await homePage.navigateToProducts()
    await productsPage.addProductToCart('Test Laptop')
    
    // 3. Cart functionality
    await homePage.openCart()
    await expectProductInCart(page, 'Test Laptop')

    // 4. Form interactions
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    
    // Form should be interactive
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()
  })
})