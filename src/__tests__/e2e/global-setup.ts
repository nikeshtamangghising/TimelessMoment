import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {

  const { baseURL } = config.projects[0].use
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })

    // Check if the application is responding
    await page.waitForSelector('body', { timeout: 30000 })

    // Setup test data if needed
    await setupTestData(page)

    // Create admin user for tests
    await createTestUsers(page)


  } catch (error) {
    console.error('❌ E2E test setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any) {
  
  try {
    // You could make API calls here to set up test data
    // For now, we'll assume the application has seed data
    
    // Example: Create test products via API
    const response = await page.request.get('/api/products?limit=1')
    if (response.ok()) {
      const data = await response.json()
      if (data.data.length === 0) {
      } else {
      }
    }
  } catch (error) {
  }
}

async function createTestUsers(page: any) {
  
  try {
    // Create test customer user
    const customerResponse = await page.request.post('/api/auth/register', {
      data: {
        email: 'test-customer@example.com',
        name: 'Test Customer',
        password: 'password123',
        role: 'CUSTOMER'
      }
    })

    if (customerResponse.ok()) {
    } else if (customerResponse.status() === 400) {
    }

    // Create test admin user
    const adminResponse = await page.request.post('/api/auth/register', {
      data: {
        email: 'test-admin@example.com',
        name: 'Test Admin',
        password: 'password123',
        role: 'ADMIN'
      }
    })

    if (adminResponse.ok()) {
    } else if (adminResponse.status() === 400) {
    }

  } catch (error) {
  }
}

export default globalSetup