import { Page, Locator, expect } from '@playwright/test'

export class CheckoutPage {
  readonly page: Page
  readonly orderSummary: Locator
  readonly shippingForm: Locator
  readonly paymentForm: Locator
  readonly placeOrderButton: Locator
  readonly orderTotal: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    this.orderSummary = page.locator('[data-testid="order-summary"]')
    this.shippingForm = page.locator('[data-testid="shipping-form"]')
    this.paymentForm = page.locator('[data-testid="payment-form"]')
    this.placeOrderButton = page.locator('[data-testid="place-order"]')
    this.orderTotal = page.locator('[data-testid="order-total"]')
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
  }

  async goto() {
    await this.page.goto('/checkout')
    await this.page.waitForLoadState('networkidle')
  }

  async fillShippingInformation(shippingInfo: {
    firstName: string
    lastName: string
    email: string
    address: string
    city: string
    postalCode: string
    country: string
  }) {
    await this.page.fill('[name="firstName"]', shippingInfo.firstName)
    await this.page.fill('[name="lastName"]', shippingInfo.lastName)
    await this.page.fill('[name="email"]', shippingInfo.email)
    await this.page.fill('[name="address"]', shippingInfo.address)
    await this.page.fill('[name="city"]', shippingInfo.city)
    await this.page.fill('[name="postalCode"]', shippingInfo.postalCode)
    await this.page.selectOption('[name="country"]', shippingInfo.country)
  }

  async fillPaymentInformation(paymentInfo: {
    cardNumber: string
    expiryDate: string
    cvv: string
    cardholderName: string
  }) {
    // Switch to Stripe iframe if using Stripe Elements
    const stripeFrame = this.page.frameLocator('[name^="__privateStripeFrame"]')
    
    if (await stripeFrame.locator('[name="cardnumber"]').isVisible()) {
      await stripeFrame.locator('[name="cardnumber"]').fill(paymentInfo.cardNumber)
      await stripeFrame.locator('[name="exp-date"]').fill(paymentInfo.expiryDate)
      await stripeFrame.locator('[name="cvc"]').fill(paymentInfo.cvv)
    } else {
      // Fallback to regular form fields
      await this.page.fill('[name="cardNumber"]', paymentInfo.cardNumber)
      await this.page.fill('[name="expiryDate"]', paymentInfo.expiryDate)
      await this.page.fill('[name="cvv"]', paymentInfo.cvv)
    }
    
    await this.page.fill('[name="cardholderName"]', paymentInfo.cardholderName)
  }

  async selectShippingMethod(method: string) {
    await this.page.check(`[data-testid="shipping-${method}"]`)
  }

  async applyPromoCode(code: string) {
    await this.page.fill('[data-testid="promo-code"]', code)
    await this.page.click('[data-testid="apply-promo"]')
    
    // Wait for the discount to be applied
    await this.page.waitForTimeout(1000)
  }

  async placeOrder() {
    await this.placeOrderButton.click()
    
    // Wait for processing
    await expect(this.loadingSpinner).toBeVisible()
    await expect(this.loadingSpinner).toBeHidden({ timeout: 30000 })
  }

  async expectOrderSummaryVisible() {
    await expect(this.orderSummary).toBeVisible()
  }

  async expectOrderTotal(expectedTotal: string) {
    await expect(this.orderTotal).toContainText(expectedTotal)
  }

  async expectItemInOrder(itemName: string) {
    const orderItem = this.orderSummary.locator(`[data-testid="order-item"]:has-text("${itemName}")`)
    await expect(orderItem).toBeVisible()
  }

  async expectShippingFormVisible() {
    await expect(this.shippingForm).toBeVisible()
  }

  async expectPaymentFormVisible() {
    await expect(this.paymentForm).toBeVisible()
  }

  async expectFormValidationError(fieldName: string) {
    const errorMessage = this.page.locator(`[data-testid="${fieldName}-error"]`)
    await expect(errorMessage).toBeVisible()
  }

  async expectSuccessRedirect() {
    await this.page.waitForURL(/.*checkout\/success.*/)
    await expect(this.page.locator('text=Order Confirmed')).toBeVisible()
  }

  async expectPaymentError() {
    await expect(this.page.locator('[data-testid="payment-error"]')).toBeVisible()
  }

  async getOrderTotal(): Promise<string> {
    return await this.orderTotal.textContent() || '0'
  }

  async getItemCount(): Promise<number> {
    const items = this.orderSummary.locator('[data-testid="order-item"]')
    return await items.count()
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await expect(this.orderSummary).toBeVisible()
  }
}