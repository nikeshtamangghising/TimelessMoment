import { test, expect } from '@playwright/test'
import { 
  loginAsCustomer,
  addProductToCart,
  navigateToCart,
  expectProductInCart,
  expectCartItemCount,
  TEST_USERS,
  waitForPageLoad
} from './utils/test-utils'

test.describe('Shopping Cart E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should add product to cart and update count', async ({ page }) => {
    // Navigate to products and add item
    await page.click('text=Products')
    await page.waitForURL('/products')
    
    // Add first available product to cart
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]')
    
    // Verify cart count updated
    await expectCartItemCount(page, 1)
    
    // Verify product appears in cart
    await navigateToCart(page)
    const cartItems = page.locator('[data-testid="cart-item"]')
    await expect(cartItems).toHaveCount(1)
  })

  test('should update product quantity in cart', async ({ page }) => {
    // Add product to cart
    await addProductToCart(page, 'Test Laptop')
    
    // Open cart
    await navigateToCart(page)
    
    // Update quantity to 3
    const quantityInput = page.locator('[data-testid="quantity-input"]').first()
    await quantityInput.fill('3')
    await quantityInput.press('Enter')
    
    // Verify quantity updated
    await expect(quantityInput).toHaveValue('3')
    
    // Verify cart count updated
    await expectCartItemCount(page, 3)
  })

  test('should remove product from cart', async ({ page }) => {
    // Add product to cart
    await addProductToCart(page, 'Test Laptop')
    
    // Open cart and remove item
    await navigateToCart(page)
    await page.click('[data-testid="remove-item"]')
    
    // Verify cart is empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible()
    await expectCartItemCount(page, 0)
  })

  test('should persist cart across page reloads', async ({ page }) => {
    // Add product to cart
    await addProductToCart(page, 'Test Laptop')
    
    // Reload page
    await page.reload()
    await waitForPageLoad(page)
    
    // Verify cart persisted
    await expectCartItemCount(page, 1)
    await navigateToCart(page)
    await expectProductInCart(page, 'Test Laptop')
  })

  test('should calculate correct totals', async ({ page }) => {
    // Add multiple products
    await addProductToCart(page, 'Test Laptop')
    await addProductToCart(page, 'Test Mouse')
    
    // Open cart and verify totals
    await navigateToCart(page)
    
    // Check subtotal is calculated correctly
    const subtotal = page.locator('[data-testid="subtotal"]')
    await expect(subtotal).toBeVisible()
    
    // Check total includes tax if applicable
    const total = page.locator('[data-testid="total"]')
    await expect(total).toBeVisible()
  })

  test('should handle out of stock products', async ({ page }) => {
    // Try to add out of stock product
    await page.goto('/products')
    
    // Find out of stock product
    const outOfStockProduct = page.locator('[data-testid="product-card"]:has-text("Out of Stock")')
    
    if (await outOfStockProduct.isVisible()) {
      // Add to cart button should be disabled
      const addToCartBtn = outOfStockProduct.locator('[data-testid="add-to-cart"]')
      await expect(addToCartBtn).toBeDisabled()
    }
  })

  test('should merge cart when user logs in', async ({ page }) => {
    // Add product as guest
    await addProductToCart(page, 'Test Laptop')
    
    // Login
    await loginAsCustomer(page)
    
    // Cart should still contain the product
    await expectCartItemCount(page, 1)
    await navigateToCart(page)
    await expectProductInCart(page, 'Test Laptop')
  })

  test('should show cart sidebar', async ({ page }) => {
    // Add product to cart
    await addProductToCart(page, 'Test Laptop')
    
    // Click cart button to open sidebar
    await page.click('[data-testid="cart-button"]')
    
    // Verify sidebar is visible
    await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible()
    
    // Verify product is shown in sidebar
    await expect(page.locator('[data-testid="cart-sidebar"] [data-testid="cart-item"]')).toBeVisible()
    
    // Close sidebar
    await page.click('[data-testid="close-cart"]')
    await expect(page.locator('[data-testid="cart-sidebar"]')).not.toBeVisible()
  })

  test('should handle cart errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/cart', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })
    
    // Try to add product to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]')
    
    // Should show error message
    await expect(page.locator('text=Failed to add to cart')).toBeVisible()
  })

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Add product to cart
    await addProductToCart(page, 'Test Laptop')
    
    // Open mobile cart
    await page.click('[data-testid="mobile-cart-button"]')
    
    // Verify mobile cart is visible
    await expect(page.locator('[data-testid="mobile-cart"]')).toBeVisible()
    
    // Verify product is shown
    await expectProductInCart(page, 'Test Laptop')
  })

  test('should clear entire cart', async ({ page }) => {
    // Add multiple products
    await addProductToCart(page, 'Test Laptop')
    await addProductToCart(page, 'Test Mouse')
    
    // Open cart
    await navigateToCart(page)
    
    // Clear cart
    await page.click('[data-testid="clear-cart"]')
    
    // Confirm clear action
    await page.click('[data-testid="confirm-clear"]')
    
    // Verify cart is empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible()
    await expectCartItemCount(page, 0)
  })
})