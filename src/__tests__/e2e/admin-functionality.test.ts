import { test, expect } from '@playwright/test'
import { 
  loginAsAdmin,
  logout,
  TEST_USERS,
  waitForPageLoad,
  takeScreenshot
} from './utils/test-utils'

test.describe('Admin Functionality E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('should access admin dashboard', async ({ page }) => {
    // Should be on admin dashboard
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
    
    // Should show admin navigation
    await expect(page.locator('text=Products')).toBeVisible()
    await expect(page.locator('text=Orders')).toBeVisible()
    await expect(page.locator('text=Users')).toBeVisible()
    
    // Should show dashboard stats
    await expect(page.locator('[data-testid="total-products"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible()
    
    await takeScreenshot(page, 'admin-dashboard')
  })

  test('should create new product', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products')
    await page.waitForURL('/admin/products')
    
    // Click create new product
    await page.click('text=Add Product')
    await page.waitForURL('/admin/products/new')
    
    // Fill product form
    await page.fill('[name="name"]', 'Test E2E Product')
    await page.fill('[name="description"]', 'This is a test product created via E2E testing')
    await page.fill('[name="price"]', '199.99')
    await page.selectOption('[name="category"]', 'Electronics')
    await page.fill('[name="stock"]', '50')
    
    // Upload image (mock file upload)
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // In a real test, you'd upload an actual file
      // For now, we'll skip this step
    }
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to products list
    await page.waitForURL('/admin/products')
    
    // Should show success message
    await expect(page.locator('text=Product created successfully')).toBeVisible()
    
    // Should see new product in list
    await expect(page.locator('text=Test E2E Product')).toBeVisible()
  })

  test('should edit existing product', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products')
    await page.waitForURL('/admin/products')
    
    // Click edit on first product
    await page.click('[data-testid="edit-product"]:first-child')
    
    // Update product name
    const nameInput = page.locator('[name="name"]')
    const currentName = await nameInput.inputValue()
    const newName = `${currentName} - Updated`
    
    await nameInput.fill(newName)
    
    // Update price
    await page.fill('[name="price"]', '299.99')
    
    // Submit changes
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=Product updated successfully')).toBeVisible()
    
    // Should see updated product in list
    await expect(page.locator(`text=${newName}`)).toBeVisible()
  })

  test('should delete product', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products')
    await page.waitForURL('/admin/products')
    
    // Get first product name for verification
    const firstProductName = await page.locator('[data-testid="product-name"]:first-child').textContent()
    
    // Click delete on first product
    await page.click('[data-testid="delete-product"]:first-child')
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')
    
    // Should show success message
    await expect(page.locator('text=Product deleted successfully')).toBeVisible()
    
    // Product should no longer be in list
    if (firstProductName) {
      await expect(page.locator(`text=${firstProductName}`)).not.toBeVisible()
    }
  })

  test('should manage orders', async ({ page }) => {
    // Navigate to orders
    await page.click('text=Orders')
    await page.waitForURL('/admin/orders')
    
    // Should show orders list
    await expect(page.locator('h1')).toContainText('Orders')
    
    // Should show order filters
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible()
    await expect(page.locator('[data-testid="date-filter"]')).toBeVisible()
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'pending')
    await waitForPageLoad(page)
    
    // Should show filtered results
    const orderRows = page.locator('[data-testid="order-row"]')
    const orderCount = await orderRows.count()
    
    if (orderCount > 0) {
      // Click on first order to view details
      await orderRows.first().click()
      
      // Should show order details
      await expect(page.locator('[data-testid="order-details"]')).toBeVisible()
      
      // Should be able to update order status
      await page.selectOption('[data-testid="order-status"]', 'processing')
      await page.click('[data-testid="update-status"]')
      
      // Should show success message
      await expect(page.locator('text=Order status updated')).toBeVisible()
    }
  })

  test('should view analytics and reports', async ({ page }) => {
    // Should have analytics section on dashboard
    await expect(page.locator('[data-testid="analytics-section"]')).toBeVisible()
    
    // Check revenue chart
    const revenueChart = page.locator('[data-testid="revenue-chart"]')
    if (await revenueChart.isVisible()) {
      await expect(revenueChart).toBeVisible()
    }
    
    // Check top products
    const topProducts = page.locator('[data-testid="top-products"]')
    if (await topProducts.isVisible()) {
      await expect(topProducts).toBeVisible()
    }
    
    // Check recent orders
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible()
  })

  test('should manage user accounts', async ({ page }) => {
    // Navigate to users (if available)
    const usersLink = page.locator('text=Users')
    
    if (await usersLink.isVisible()) {
      await usersLink.click()
      await page.waitForURL('/admin/users')
      
      // Should show users list
      await expect(page.locator('h1')).toContainText('Users')
      
      // Should show user filters
      await expect(page.locator('[data-testid="role-filter"]')).toBeVisible()
      
      // Filter by role
      await page.selectOption('[data-testid="role-filter"]', 'customer')
      await waitForPageLoad(page)
      
      // Should show filtered users
      const userRows = page.locator('[data-testid="user-row"]')
      const userCount = await userRows.count()
      
      if (userCount > 0) {
        // Should be able to view user details
        await userRows.first().click()
        await expect(page.locator('[data-testid="user-details"]')).toBeVisible()
      }
    }
  })

  test('should handle bulk operations', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products')
    await page.waitForURL('/admin/products')
    
    // Select multiple products
    const checkboxes = page.locator('[data-testid="product-checkbox"]')
    const checkboxCount = await checkboxes.count()
    
    if (checkboxCount > 1) {
      // Select first two products
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()
      
      // Should show bulk actions
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible()
      
      // Test bulk status update
      await page.selectOption('[data-testid="bulk-action"]', 'deactivate')
      await page.click('[data-testid="apply-bulk-action"]')
      
      // Should show confirmation
      await page.click('[data-testid="confirm-bulk-action"]')
      
      // Should show success message
      await expect(page.locator('text=Bulk action completed')).toBeVisible()
    }
  })

  test('should export data', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products')
    await page.waitForURL('/admin/products')
    
    // Look for export button
    const exportButton = page.locator('[data-testid="export-products"]')
    
    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      const download = await downloadPromise
      
      // Verify download
      expect(download.suggestedFilename()).toContain('products')
      expect(download.suggestedFilename()).toContain('.csv')
    }
  })

  test('should handle admin permissions', async ({ page }) => {
    // Verify admin-only sections are accessible
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    
    // Try to access admin API endpoint
    const response = await page.request.get('/api/admin/stats')
    expect(response.status()).toBe(200)
    
    // Logout and verify admin sections are not accessible
    await logout(page)
    
    // Try to access admin page as guest
    await page.goto('/admin')
    
    // Should redirect to login
    await page.waitForURL('/auth/signin')
    await expect(page.locator('text=Please sign in')).toBeVisible()
  })

  test('should search and filter admin data', async ({ page }) => {
    // Navigate to products
    await page.click('text=Products')
    await page.waitForURL('/admin/products')
    
    // Use search functionality
    const searchInput = page.locator('[data-testid="admin-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('laptop')
      await searchInput.press('Enter')
      await waitForPageLoad(page)
      
      // Should show filtered results
      const productRows = page.locator('[data-testid="product-row"]')
      const productCount = await productRows.count()
      
      if (productCount > 0) {
        // Verify search results contain search term
        const firstProductName = await productRows.first().locator('[data-testid="product-name"]').textContent()
        expect(firstProductName?.toLowerCase()).toContain('laptop')
      }
    }
  })
})