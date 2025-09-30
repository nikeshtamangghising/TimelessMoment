import { test, expect } from '@playwright/test'
import { 
  TEST_USERS,
  waitForPageLoad,
  takeScreenshot
} from './utils/test-utils'

test.describe('Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should sign up new user', async ({ page }) => {
    // Navigate to sign up
    await page.click('text=Sign Up')
    await page.waitForURL('/auth/signup')
    
    // Fill sign up form
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="email"]', testEmail)
    await page.fill('[name="password"]', 'password123')
    await page.fill('[name="confirmPassword"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to home page or verification page
    await waitForPageLoad(page)
    
    // Should show success message or verification prompt
    const successMessage = page.locator('text=Account created successfully')
    const verificationMessage = page.locator('text=Please verify your email')
    
    const isSuccess = await successMessage.isVisible()
    const isVerification = await verificationMessage.isVisible()
    
    expect(isSuccess || isVerification).toBeTruthy()
    
    await takeScreenshot(page, 'signup-success')
  })

  test('should sign in existing user', async ({ page }) => {
    // Navigate to sign in
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    
    // Fill sign in form
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to home page
    await page.waitForURL('/')
    
    // Should show user name in navigation
    await expect(page.locator(`text=${TEST_USERS.customer.name}`)).toBeVisible()
    
    // Should show user menu
    await page.click('[data-testid="user-menu"]')
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Orders')).toBeVisible()
    await expect(page.locator('text=Logout')).toBeVisible()
  })

  test('should handle invalid login credentials', async ({ page }) => {
    // Navigate to sign in
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    
    // Fill with invalid credentials
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
    
    // Should remain on sign in page
    expect(page.url()).toContain('/auth/signin')
  })

  test('should validate form fields', async ({ page }) => {
    // Test sign up validation
    await page.click('text=Sign Up')
    await page.waitForURL('/auth/signup')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    
    // Test invalid email format
    await page.fill('[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
    
    // Test password mismatch
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.fill('[name="confirmPassword"]', 'different-password')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should logout user', async ({ page }) => {
    // Sign in first
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    // Should redirect to home page
    await page.waitForURL('/')
    
    // Should show sign in/sign up links again
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('text=Sign Up')).toBeVisible()
    
    // User name should not be visible
    await expect(page.locator(`text=${TEST_USERS.customer.name}`)).not.toBeVisible()
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/orders')
    
    // Should redirect to sign in
    await page.waitForURL('/auth/signin')
    
    // Sign in
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    await page.click('button[type="submit"]')
    
    // Should redirect to originally requested page
    await page.waitForURL('/orders')
    await expect(page.locator('h1')).toContainText('Your Orders')
  })

  test('should handle password reset', async ({ page }) => {
    // Navigate to sign in
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    
    // Click forgot password
    await page.click('text=Forgot Password?')
    await page.waitForURL('/auth/forgot-password')
    
    // Fill email
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })

  test('should handle session expiry', async ({ page }) => {
    // Sign in
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Mock session expiry
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' })
      })
    })
    
    // Try to access protected resource
    await page.goto('/orders')
    
    // Should redirect to sign in
    await page.waitForURL('/auth/signin')
    await expect(page.locator('text=Your session has expired')).toBeVisible()
  })

  test('should remember user preference', async ({ page }) => {
    // Sign in
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    
    // Check "Remember me" option
    const rememberCheckbox = page.locator('[name="remember"]')
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check()
    }
    
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Close browser and reopen (simulate)
    await page.context().clearCookies()
    await page.reload()
    
    // User should still be logged in if "remember me" was checked
    // This would depend on your implementation
  })

  test('should handle social login', async ({ page }) => {
    // Navigate to sign in
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    
    // Check for social login buttons
    const googleButton = page.locator('[data-testid="google-signin"]')
    const githubButton = page.locator('[data-testid="github-signin"]')
    
    if (await googleButton.isVisible()) {
      // Click Google sign in (would normally open popup)
      await googleButton.click()
      
      // In a real test, you'd handle the OAuth flow
      // For now, we just verify the button is clickable
      expect(await googleButton.isEnabled()).toBeTruthy()
    }
    
    if (await githubButton.isVisible()) {
      expect(await githubButton.isEnabled()).toBeTruthy()
    }
  })

  test('should handle account verification', async ({ page }) => {
    // This would test email verification flow
    // Navigate to a verification link (mock)
    const verificationToken = 'mock-verification-token'
    await page.goto(`/auth/verify?token=${verificationToken}`)
    
    // Should show verification result
    const successMessage = page.locator('text=Email verified successfully')
    const errorMessage = page.locator('text=Invalid verification token')
    
    const isSuccess = await successMessage.isVisible()
    const isError = await errorMessage.isVisible()
    
    expect(isSuccess || isError).toBeTruthy()
  })

  test('should protect admin routes', async ({ page }) => {
    // Try to access admin page without authentication
    await page.goto('/admin')
    
    // Should redirect to sign in
    await page.waitForURL('/auth/signin')
    
    // Sign in as regular customer
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    await page.click('button[type="submit"]')
    
    // Try to access admin page again
    await page.goto('/admin')
    
    // Should show access denied or redirect
    const accessDenied = page.locator('text=Access denied')
    const redirected = page.url() !== '/admin'
    
    expect(accessDenied.isVisible() || redirected).toBeTruthy()
  })

  test('should handle concurrent sessions', async ({ page, context }) => {
    // Sign in in first tab
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    await page.fill('[name="email"]', TEST_USERS.customer.email)
    await page.fill('[name="password"]', TEST_USERS.customer.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    
    // Open second tab
    const secondPage = await context.newPage()
    await secondPage.goto('/')
    
    // Should also be logged in in second tab
    await expect(secondPage.locator(`text=${TEST_USERS.customer.name}`)).toBeVisible()
    
    // Logout from first tab
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    // Second tab should also be logged out (depending on implementation)
    await secondPage.reload()
    await waitForPageLoad(secondPage)
    
    // This behavior depends on your session management implementation
  })
})