// Debug script for cart summary API
const testCartData = {
  items: [
    {
      productId: "test-product-1",
      quantity: 2,
      product: {
        id: "test-product-1",
        name: "Test Product",
        price: 100,
        discountPrice: 90,
        images: ["test-image.jpg"],
        slug: "test-product",
      }
    }
  ]
};

// Test with minimal data (no product field)
const testCartDataMinimal = {
  items: [
    {
      productId: "test-product-1",
      quantity: 2
    }
  ]
};

async function testCartSummaryAPI() {
  console.log('=== Testing with full product data ===');
  await testWithData(testCartData);
  
  console.log('\n=== Testing with minimal data (no product field) ===');
  await testWithData(testCartDataMinimal);
}

async function testWithData(data) {
  try {
    console.log('Request data:', JSON.stringify(data, null, 2));
    
    const response = await fetch('http://localhost:3000/api/cart/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      console.error('API call failed with status:', response.status);
      console.error('Error response:', responseText);
    } else {
      console.log('API call successful!');
      const data = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testCartSummaryAPI();
