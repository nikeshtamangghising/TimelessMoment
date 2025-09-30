import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')

  const { baseURL } = config.projects[0].use
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    console.log(`⏳ Waiting for application at ${baseURL}...`)
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })

    // Check if the application is responding
    await page.waitForSelector('body', { timeout: 30000 })
    console.log('✅ Application is ready')

    // Setup test data if needed
    await setupTestData(page)

    // Create admin user for tests
    await createTestUsers(page)

    console.log('✅ E2E test setup completed')

  } catch (error) {
    console.error('❌ E2E test setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any) {
  console.log('📦 Setting up test data...')
  
  try {
    // You could make API calls here to set up test data
    // For now, we'll assume the application has seed data
    
    // Example: Create test products via API
    const response = await page.request.get('/api/products?limit=1')
    if (response.ok()) {
      const data = await response.json()
      if (data.data.length === 0) {
        console.log('⚠️  No products found, you may need to run database seeding')
      } else {
        console.log(`✅ Found ${data.data.length} test products`)
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not verify test data:', error)
  }
}

async function createTestUsers(page: any) {
  console.log('👥 Setting up test users...')
  
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
      console.log('✅ Test customer user created')
    } else if (customerResponse.status() === 400) {
      console.log('ℹ️  Test customer user already exists')
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
      console.log('✅ Test admin user created')
    } else if (adminResponse.status() === 400) {
      console.log('ℹ️  Test admin user already exists')
    }

  } catch (error) {
    console.warn('⚠️  Could not create test users:', error)
  }
}

export default globalSetup