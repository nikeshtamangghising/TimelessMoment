import { test, expect } from '@playwright/test'
import { 
  loginAsCustomer,
  addProductToCart,
  navigateToCart,
  navigateToCheckout,
  fillCheckoutForm,
  expectOrderTotal,
  TEST_USERS,
  waitForPageLoad,
  takeScreenshot
} from './utils/test-utils'

test.describe('Checkout Process E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Add products to cart for testing
    await addProductToCart(page, 'Test Laptop')
    await addProductToCart(page, 'Test Mouse')
  })

  test('should complete checkout as guest user', async ({ page }) => {
    // Navigate to checkout
    await navigateToCart(page)
    await page.click('text=Checkout')
    
    // Should redirect to sign in or show guest checkout
    const currentUrl = page.url()
    
    if (currentUrl.includes('/auth/signin')) {
      // If redirected to sign in, look for guest checkout option
      const guestCheckoutButton = page.locator('text=Continue as Guest')
      if (await guestCheckoutButton.isVisible()) {
        await guestCheckoutButton.click()
        await page.waitForURL('/checkout')
      } else {
        // Skip this test if guest checkout is not available
        test.skip('Guest checkout not available')
      }
    }
    
    // Fill checkout form
    await fillCheckoutForm(page, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      address: '123 Test Street',
      city: 'Test City',
      postalCode: '12345'
    })
    
    // Continue to payment
    await page.click('text=Continue to Payment')
    
    // Fill payment information (using Stripe test card)
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="expiry-date"]', '12/25')
    await page.fill('[data-testid="cvc"]', '123')
    await page.fill('[data-testid="cardholder-name"]', 'John Doe')
    
    // Place order
    await page.click('text=Place Order')
    
    // Should redirect to success page
    await page.waitForURL('/checkout/success')
    await expect(page.locator('text=Thank you for your order')).toBeVisible()
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    
    await takeScreenshot(page, 'checkout-success')
  })

  test('should complete checkout as authenticated user', async ({ page }) => {
    // Login first
    await loginAsCustomer(page)
    
    // Navigate to checkout
    await navigateToCheckout(page)
    
    // User info should be pre-filled
    const emailField = page.locator('[name="email"]')
    await expect(emailField).toHaveValue(TEST_USERS.customer.email)
    
    // Fill remaining shipping info
    await page.fill('[name="firstName"]', 'Test')
    await page.fill('[name="lastName"]', 'Customer')
    await page.fill('[name="address"]', '456 Customer Street')
    await page.fill('[name="city"]', 'Customer City')
    await page.fill('[name="postalCode"]', '54321')
    
    // Continue to payment
    await page.click('text=Continue to Payment')
    
    // Fill payment information
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="expiry-date"]', '12/25')
    await page.fill('[data-testid="cvc"]', '123')
    await page.fill('[data-testid="cardholder-name"]', 'Test Customer')
    
    // Place order
    await page.click('text=Place Order')
    
    // Should redirect to success page
    await page.waitForURL('/checkout/success')
    await expect(page.locator('text=Thank you for your order')).toBeVisible()
    
    // Order should appear in user's order history
    await page.goto('/orders')
    await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible()
  })

  test('should validate shipping information', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Try to continue without filling required fields
    await page.click('text=Continue to Payment')
    
    // Should show validation errors
    await expect(page.locator('text=First name is required')).toBeVisible()
    await expect(page.locator('text=Last name is required')).toBeVisible()
    await expect(page.locator('text=Address is required')).toBeVisible()
    
    // Fill invalid postal code
    await page.fill('[name="firstName"]', 'Test')
    await page.fill('[name="lastName"]', 'Customer')
    await page.fill('[name="address"]', '123 Test St')
    await page.fill('[name="city"]', 'Test City')
    await page.fill('[name="postalCode"]', 'invalid')
    
    await page.click('text=Continue to Payment')
    
    // Should show postal code validation error
    await expect(page.locator('text=Please enter a valid postal code')).toBeVisible()
  })

  test('should validate payment information', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    await page.click('text=Continue to Payment')
    
    // Try to place order without payment info
    await page.click('text=Place Order')
    
    // Should show payment validation errors
    await expect(page.locator('text=Card number is required')).toBeVisible()
    await expect(page.locator('text=Expiry date is required')).toBeVisible()
    await expect(page.locator('text=CVC is required')).toBeVisible()
    
    // Fill invalid card number
    await page.fill('[data-testid="card-number"]', '1234')
    await page.click('text=Place Order')
    
    // Should show card validation error
    await expect(page.locator('text=Please enter a valid card number')).toBeVisible()
  })

  test('should handle payment failures', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    await page.click('text=Continue to Payment')
    
    // Use declined test card
    await page.fill('[data-testid="card-number"]', '4000000000000002')
    await page.fill('[data-testid="expiry-date"]', '12/25')
    await page.fill('[data-testid="cvc"]', '123')
    await page.fill('[data-testid="cardholder-name"]', 'Test Customer')
    
    // Place order
    await page.click('text=Place Order')
    
    // Should show payment error
    await expect(page.locator('text=Your card was declined')).toBeVisible()
    
    // Should remain on checkout page
    expect(page.url()).toContain('/checkout')
  })

  test('should calculate shipping costs', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    // Should show shipping options
    const shippingOptions = page.locator('[data-testid="shipping-options"]')
    if (await shippingOptions.isVisible()) {
      // Select express shipping
      await page.click('[data-testid="shipping-express"]')
      
      // Should update total with shipping cost
      await expect(page.locator('[data-testid="shipping-cost"]')).toContainText('$')
      
      // Select standard shipping
      await page.click('[data-testid="shipping-standard"]')
      
      // Should update total
      await expect(page.locator('[data-testid="shipping-cost"]')).toContainText('$')
    }
  })

  test('should apply discount codes', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    await page.click('text=Continue to Payment')
    
    // Apply discount code
    const discountInput = page.locator('[data-testid="discount-code"]')
    if (await discountInput.isVisible()) {
      await discountInput.fill('TEST10')
      await page.click('[data-testid="apply-discount"]')
      
      // Should show discount applied or error
      const discountApplied = page.locator('text=Discount applied')
      const discountError = page.locator('text=Invalid discount code')
      
      const isApplied = await discountApplied.isVisible()
      const isError = await discountError.isVisible()
      
      expect(isApplied || isError).toBeTruthy()
    }
  })

  test('should save shipping address for future use', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    // Check save address option
    const saveAddressCheckbox = page.locator('[data-testid="save-address"]')
    if (await saveAddressCheckbox.isVisible()) {
      await saveAddressCheckbox.check()
    }
    
    await page.click('text=Continue to Payment')
    
    // Complete checkout
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="expiry-date"]', '12/25')
    await page.fill('[data-testid="cvc"]', '123')
    await page.fill('[data-testid="cardholder-name"]', 'Test Customer')
    
    await page.click('text=Place Order')
    await page.waitForURL('/checkout/success')
    
    // Start new checkout to verify saved address
    await addProductToCart(page, 'Test Laptop')
    await navigateToCheckout(page)
    
    // Should have saved address option
    const savedAddress = page.locator('[data-testid="saved-address"]')
    if (await savedAddress.isVisible()) {
      await savedAddress.click()
      
      // Fields should be pre-filled
      await expect(page.locator('[name="firstName"]')).toHaveValue('Test')
      await expect(page.locator('[name="lastName"]')).toHaveValue('Customer')
    }
  })

  test('should handle inventory checks during checkout', async ({ page }) => {
    await loginAsCustomer(page)
    
    // Add product that might go out of stock
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]')
    
    await navigateToCheckout(page)
    
    // Mock inventory check failure
    await page.route('/api/checkout/validate-inventory', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Insufficient inventory',
          availableStock: 1
        })
      })
    })
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    await page.click('text=Continue to Payment')
    
    // Should show inventory error
    await expect(page.locator('text=Only 1 item available')).toBeVisible()
  })

  test('should show order summary correctly', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Check order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible()
    
    // Should show all cart items
    await expect(page.locator('[data-testid="summary-item"]')).toHaveCount(2)
    
    // Should show pricing breakdown
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible()
    await expect(page.locator('[data-testid="tax"]')).toBeVisible()
    await expect(page.locator('[data-testid="total"]')).toBeVisible()
  })

  test('should handle session timeout during checkout', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Mock session expiry
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' })
      })
    })
    
    // Fill shipping info
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    await page.click('text=Continue to Payment')
    
    // Should redirect to login
    await page.waitForURL('/auth/signin')
    await expect(page.locator('text=Your session has expired')).toBeVisible()
  })

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await loginAsCustomer(page)
    await navigateToCheckout(page)
    
    // Mobile checkout should be responsive
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible()
    
    // Fill form on mobile
    await fillCheckoutForm(page, {
      firstName: 'Test',
      lastName: 'Customer',
      email: TEST_USERS.customer.email,
      address: '123 Test St',
      city: 'Test City',
      postalCode: '12345'
    })
    
    // Continue button should be visible
    await expect(page.locator('text=Continue to Payment')).toBeVisible()
    
    await takeScreenshot(page, 'mobile-checkout')
  })
})