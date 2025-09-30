import { Page, Locator, expect } from '@playwright/test'

export class AdminPage {
  readonly page: Page
  readonly dashboard: Locator
  readonly sidebar: Locator
  readonly statsCards: Locator
  readonly recentOrders: Locator
  readonly productManagement: Locator
  readonly orderManagement: Locator

  constructor(page: Page) {
    this.page = page
    this.dashboard = page.locator('[data-testid="admin-dashboard"]')
    this.sidebar = page.locator('[data-testid="admin-sidebar"]')
    this.statsCards = page.locator('[data-testid="stats-cards"]')
    this.recentOrders = page.locator('[data-testid="recent-orders"]')
    this.productManagement = page.locator('[data-testid="product-management"]')
    this.orderManagement = page.locator('[data-testid="order-management"]')
  }

  async goto() {
    await this.page.goto('/admin')
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToProducts() {
    await this.page.click('[data-testid="nav-products"]')
    await this.page.waitForURL('/admin/products')
  }

  async navigateToOrders() {
    await this.page.click('[data-testid="nav-orders"]')
    await this.page.waitForURL('/admin/orders')
  }

  async navigateToUsers() {
    await this.page.click('[data-testid="nav-users"]')
    await this.page.waitForURL('/admin/users')
  }

  async createNewProduct(productData: {
    name: string
    description: string
    price: string
    category: string
    stock: string
  }) {
    await this.navigateToProducts()
    await this.page.click('[data-testid="new-product-button"]')
    
    // Fill product form
    await this.page.fill('[name="name"]', productData.name)
    await this.page.fill('[name="description"]', productData.description)
    await this.page.fill('[name="price"]', productData.price)
    await this.page.selectOption('[name="category"]', productData.category)
    await this.page.fill('[name="stock"]', productData.stock)
    
    // Submit form
    await this.page.click('[data-testid="save-product"]')
    
    // Wait for success message
    await expect(this.page.locator('text=Product created successfully')).toBeVisible()
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    await this.navigateToOrders()
    
    // Find order row
    const orderRow = this.page.locator(`[data-testid="order-row-${orderId}"]`)
    await expect(orderRow).toBeVisible()
    
    // Click edit button
    await orderRow.locator('[data-testid="edit-order"]').click()
    
    // Update status
    await this.page.selectOption('[name="status"]', newStatus)
    await this.page.click('[data-testid="save-order"]')
    
    // Wait for success message
    await expect(this.page.locator('text=Order updated successfully')).toBeVisible()
  }

  async searchOrders(searchTerm: string) {
    await this.navigateToOrders()
    await this.page.fill('[data-testid="order-search"]', searchTerm)
    await this.page.press('[data-testid="order-search"]', 'Enter')
    await this.page.waitForLoadState('networkidle')
  }

  async exportOrders(format: 'csv' | 'excel') {
    await this.navigateToOrders()
    await this.page.click('[data-testid="export-orders"]')
    await this.page.click(`[data-testid="export-${format}"]`)
    
    // Wait for download to start
    const downloadPromise = this.page.waitForEvent('download')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toContain(format)
  }

  async expectDashboardVisible() {
    await expect(this.dashboard).toBeVisible()
    await expect(this.statsCards).toBeVisible()
  }

  async expectStatsCardsLoaded() {
    const statsCards = this.statsCards.locator('[data-testid="stat-card"]')
    await expect(statsCards.first()).toBeVisible()
    
    // Check that stats have actual values (not loading)
    const firstStatValue = statsCards.first().locator('[data-testid="stat-value"]')
    await expect(firstStatValue).not.toBeEmpty()
  }

  async expectRecentOrdersVisible() {
    await expect(this.recentOrders).toBeVisible()
    const orderRows = this.recentOrders.locator('[data-testid="order-row"]')
    await expect(orderRows.first()).toBeVisible()
  }

  async expectProductInList(productName: string) {
    await this.navigateToProducts()
    const productRow = this.page.locator(`[data-testid="product-row"]:has-text("${productName}")`)
    await expect(productRow).toBeVisible()
  }

  async expectOrderInList(orderId: string) {
    await this.navigateToOrders()
    const orderRow = this.page.locator(`[data-testid="order-row-${orderId}"]`)
    await expect(orderRow).toBeVisible()
  }

  async expectOrderStatus(orderId: string, status: string) {
    const orderRow = this.page.locator(`[data-testid="order-row-${orderId}"]`)
    const statusBadge = orderRow.locator('[data-testid="order-status"]')
    await expect(statusBadge).toContainText(status)
  }

  async getOrderCount(): Promise<number> {
    await this.navigateToOrders()
    const orderRows = this.page.locator('[data-testid="order-row"]')
    return await orderRows.count()
  }

  async getProductCount(): Promise<number> {
    await this.navigateToProducts()
    const productRows = this.page.locator('[data-testid="product-row"]')
    return await productRows.count()
  }
}