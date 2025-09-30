import { Page, Locator, expect } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly heroSection: Locator
  readonly featuredProducts: Locator
  readonly navigationMenu: Locator
  readonly searchInput: Locator
  readonly cartButton: Locator
  readonly userMenu: Locator

  constructor(page: Page) {
    this.page = page
    this.heroSection = page.locator('[data-testid="hero-section"]')
    this.featuredProducts = page.locator('[data-testid="featured-products"]')
    this.navigationMenu = page.locator('[data-testid="navigation-menu"]')
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.cartButton = page.locator('[data-testid="cart-button"]')
    this.userMenu = page.locator('[data-testid="user-menu"]')
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async searchForProduct(searchTerm: string) {
    await this.searchInput.fill(searchTerm)
    await this.searchInput.press('Enter')
    await this.page.waitForURL(/.*products.*/)
  }

  async navigateToProducts() {
    await this.page.click('text=Products')
    await this.page.waitForURL('/products')
  }

  async navigateToCategories() {
    await this.page.click('text=Categories')
    await this.page.waitForURL('/categories')
  }

  async openCart() {
    await this.cartButton.click()
    await expect(this.page.locator('[data-testid="cart-sidebar"]')).toBeVisible()
  }

  async openUserMenu() {
    await this.userMenu.click()
    await expect(this.page.locator('[data-testid="user-dropdown"]')).toBeVisible()
  }

  async expectPageLoaded() {
    await expect(this.heroSection).toBeVisible()
    await expect(this.featuredProducts).toBeVisible()
  }

  async expectFeaturedProductsVisible() {
    await expect(this.featuredProducts).toBeVisible()
    const productCards = this.featuredProducts.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible()
  }

  async getCartItemCount(): Promise<number> {
    const cartCount = this.page.locator('[data-testid="cart-count"]')
    if (await cartCount.isVisible()) {
      const text = await cartCount.textContent()
      return parseInt(text || '0')
    }
    return 0
  }
}