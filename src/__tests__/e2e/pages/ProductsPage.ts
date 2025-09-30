import { Page, Locator, expect } from '@playwright/test'

export class ProductsPage {
  readonly page: Page
  readonly productGrid: Locator
  readonly searchInput: Locator
  readonly categoryFilter: Locator
  readonly priceFilter: Locator
  readonly sortDropdown: Locator
  readonly loadingSpinner: Locator
  readonly paginationControls: Locator

  constructor(page: Page) {
    this.page = page
    this.productGrid = page.locator('[data-testid="product-grid"]')
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.categoryFilter = page.locator('[data-testid="category-filter"]')
    this.priceFilter = page.locator('[data-testid="price-filter"]')
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]')
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    this.paginationControls = page.locator('[data-testid="pagination"]')
  }

  async goto() {
    await this.page.goto('/products')
    await this.page.waitForLoadState('networkidle')
  }

  async searchProducts(searchTerm: string) {
    await this.searchInput.fill(searchTerm)
    await this.searchInput.press('Enter')
    await this.waitForProductsToLoad()
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category)
    await this.waitForProductsToLoad()
  }

  async filterByPriceRange(minPrice: string, maxPrice: string) {
    await this.page.fill('[data-testid="min-price"]', minPrice)
    await this.page.fill('[data-testid="max-price"]', maxPrice)
    await this.page.click('[data-testid="apply-price-filter"]')
    await this.waitForProductsToLoad()
  }

  async sortBy(sortOption: string) {
    await this.sortDropdown.selectOption(sortOption)
    await this.waitForProductsToLoad()
  }

  async clickProduct(productName: string) {
    const productCard = this.productGrid.locator(`[data-testid="product-card"]:has-text("${productName}")`)
    await productCard.click()
    await this.page.waitForLoadState('networkidle')
  }

  async addProductToCart(productName: string) {
    const productCard = this.productGrid.locator(`[data-testid="product-card"]:has-text("${productName}")`)
    const addToCartButton = productCard.locator('[data-testid="add-to-cart"]')
    await addToCartButton.click()
    
    // Wait for success message
    await expect(this.page.locator('text=Added to cart')).toBeVisible({ timeout: 5000 })
  }

  async goToNextPage() {
    await this.page.click('[data-testid="next-page"]')
    await this.waitForProductsToLoad()
  }

  async goToPreviousPage() {
    await this.page.click('[data-testid="previous-page"]')
    await this.waitForProductsToLoad()
  }

  async goToPage(pageNumber: number) {
    await this.page.click(`[data-testid="page-${pageNumber}"]`)
    await this.waitForProductsToLoad()
  }

  async waitForProductsToLoad() {
    // Wait for loading spinner to disappear
    await expect(this.loadingSpinner).toBeHidden({ timeout: 10000 })
    
    // Wait for products to be visible
    await expect(this.productGrid).toBeVisible()
  }

  async expectProductsVisible() {
    await expect(this.productGrid).toBeVisible()
    const productCards = this.productGrid.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible()
  }

  async expectProductCount(count: number) {
    const productCards = this.productGrid.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount(count)
  }

  async expectProductVisible(productName: string) {
    const productCard = this.productGrid.locator(`[data-testid="product-card"]:has-text("${productName}")`)
    await expect(productCard).toBeVisible()
  }

  async expectNoProductsMessage() {
    await expect(this.page.locator('text=No products found')).toBeVisible()
  }

  async getProductCount(): Promise<number> {
    const productCards = this.productGrid.locator('[data-testid="product-card"]')
    return await productCards.count()
  }

  async getProductPrices(): Promise<number[]> {
    const priceElements = this.productGrid.locator('[data-testid="product-price"]')
    const prices: number[] = []
    
    const count = await priceElements.count()
    for (let i = 0; i < count; i++) {
      const priceText = await priceElements.nth(i).textContent()
      const price = parseFloat(priceText?.replace('$', '') || '0')
      prices.push(price)
    }
    
    return prices
  }

  async expectPricesSorted(order: 'asc' | 'desc') {
    const prices = await this.getProductPrices()
    const sortedPrices = [...prices].sort((a, b) => order === 'asc' ? a - b : b - a)
    expect(prices).toEqual(sortedPrices)
  }
}