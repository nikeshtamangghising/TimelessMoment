const fetch = require('node-fetch')

async function testAuth() {
  try {
    console.log('Testing admin settings API...')
    
    // First try to access settings without authentication
    const response = await fetch('http://localhost:3001/api/admin/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers))
    
    const data = await response.json()
    console.log('Response data:', data)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testAuth()