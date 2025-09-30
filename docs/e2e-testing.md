# End-to-End Testing Guide

This document provides comprehensive information about the E2E testing setup for the ecommerce platform.

## Overview

Our E2E testing suite uses [Playwright](https://playwright.dev/) to test the complete user workflows across different browsers and devices. The tests cover:

- Product browsing and search
- Shopping cart functionality
- User authentication
- Checkout process
- Admin functionality
- Mobile responsiveness
- Performance benchmarks

## Test Structure

```
src/__tests__/e2e/
├── tests/
│   ├── customer-purchase-flow.test.ts    # Complete purchase workflows
│   ├── product-browsing.test.tsx         # Product catalog and search
│   ├── shopping-cart.test.ts             # Cart functionality
│   ├── authentication.test.ts            # Login/signup flows
│   ├── checkout-process.test.ts          # Checkout and payment
│   └── admin-functionality.test.ts       # Admin panel tests
├── pages/
│   ├── HomePage.ts                       # Home page object
│   ├── ProductsPage.ts                   # Products page object
│   ├── CheckoutPage.ts                   # Checkout page object
│   └── AdminPage.ts                      # Admin page object
├── utils/
│   └── test-utils.ts                     # Shared utilities and helpers
├── global-setup.ts                       # Test environment setup
└── global-teardown.ts                    # Test environment cleanup
```

## Configuration

The Playwright configuration is defined in `playwright.config.ts`:

- **Test Directory**: `./src/__tests__/e2e`
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iPhone 12, Pixel 5
- **Parallel Execution**: Enabled for faster test runs
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Set up test database:
```bash
npm run db:setup
npm run db:seed
```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test customer-purchase-flow

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests on mobile
npx playwright test --project="Mobile Chrome"
```

## Test Data

### Test Users

The following test users are available:

```typescript
// Customer account
email: 'test-customer@example.com'
password: 'password123'
name: 'Test Customer'

// Admin account  
email: 'test-admin@example.com'
password: 'password123'
name: 'Test Admin'
```

### Test Products

Test products are seeded in the database:
- Test Laptop ($999.99)
- Test Mouse ($29.99)
- Test Keyboard ($79.99)
- Test Monitor ($299.99)

## Page Objects

We use the Page Object Model pattern for maintainable tests:

### HomePage
```typescript
class HomePage {
  async goto(): Promise<void>
  async navigateToProducts(): Promise<void>
  async openCart(): Promise<void>
  async getCartItemCount(): Promise<number>
  async expectPageLoaded(): Promise<void>
}
```

### ProductsPage
```typescript
class ProductsPage {
  async searchProducts(term: string): Promise<void>
  async filterByCategory(category: string): Promise<void>
  async addProductToCart(productName: string): Promise<void>
  async expectProductsVisible(): Promise<void>
  async getProductCount(): Promise<number>
}
```

### CheckoutPage
```typescript
class CheckoutPage {
  async fillShippingInformation(info: ShippingInfo): Promise<void>
  async fillPaymentInformation(payment: PaymentInfo): Promise<void>
  async placeOrder(): Promise<void>
  async expectSuccessRedirect(): Promise<void>
}
```

## Test Utilities

Common utilities are available in `test-utils.ts`:

### Authentication
- `loginAsCustomer(page)` - Login as test customer
- `loginAsAdmin(page)` - Login as test admin
- `logout(page)` - Logout current user

### Navigation
- `navigateToProducts(page)` - Go to products page
- `navigateToCart(page)` - Open shopping cart
- `navigateToCheckout(page)` - Go to checkout

### Product Actions
- `addProductToCart(page, productName)` - Add product to cart
- `searchForProduct(page, searchTerm)` - Search products
- `expectProductInCart(page, productName)` - Verify product in cart

### Form Helpers
- `fillCheckoutForm(page, customerInfo)` - Fill checkout form
- `fillPaymentInfo(page, cardInfo)` - Fill payment details

### Assertions
- `expectCartItemCount(page, count)` - Verify cart count
- `expectOrderTotal(page, total)` - Verify order total
- `expectProductVisible(page, productName)` - Verify product visibility

## Test Scenarios

### Customer Purchase Flow
1. Browse products and search
2. Add items to cart
3. Update quantities
4. Proceed to checkout
5. Fill shipping information
6. Complete payment
7. Verify order confirmation

### Authentication Flow
1. Sign up new user
2. Email validation
3. Sign in existing user
4. Password reset
5. Session management
6. Access control

### Admin Functionality
1. Product management (CRUD)
2. Order management
3. User management
4. Analytics dashboard
5. Bulk operations
6. Data export

### Mobile Testing
1. Responsive design
2. Touch interactions
3. Mobile navigation
4. Mobile checkout
5. Performance on mobile

## Environment Variables

Configure tests using environment variables:

```bash
# Base URL for testing
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Database URL for test data
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce_test

# Stripe test keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Email service (for testing)
EMAIL_SERVICE_API_KEY=test_key
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Setup database
        run: npm run db:setup
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and isolated
- Use page objects for reusable functionality

### Data Management
- Use test-specific data
- Clean up after tests
- Avoid dependencies between tests
- Use factories for test data creation

### Assertions
- Use specific assertions
- Wait for elements properly
- Verify both positive and negative cases
- Check error states and edge cases

### Performance
- Run tests in parallel when possible
- Use selective test execution
- Optimize test data setup
- Monitor test execution time

### Debugging
- Use `page.pause()` for debugging
- Take screenshots on failures
- Use trace viewer for investigation
- Add console logs for complex flows

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout values
- Wait for network idle
- Check for slow API responses

**Element not found**
- Verify selectors are correct
- Wait for elements to appear
- Check for dynamic content loading

**Authentication issues**
- Verify test user credentials
- Check session management
- Clear cookies between tests

**Database issues**
- Ensure test database is set up
- Check database connections
- Verify test data seeding

### Debug Commands

```bash
# Run single test with debug
npx playwright test --debug customer-purchase-flow

# Run with trace
npx playwright test --trace on

# Generate and view trace
npx playwright show-trace trace.zip

# Run with verbose output
npx playwright test --reporter=list
```

## Reporting

Test results are available in multiple formats:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/results.xml`

View reports:
```bash
npm run test:e2e:report
```

## Maintenance

### Regular Tasks
- Update test data regularly
- Review and update selectors
- Monitor test execution times
- Update browser versions
- Review test coverage

### When Adding New Features
- Add corresponding E2E tests
- Update page objects if needed
- Add new test utilities
- Update documentation
- Consider mobile testing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)