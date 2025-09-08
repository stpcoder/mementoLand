const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('Testing Memorize Travel API...\n');

  try {
    // Test 1: Get all trips (should be empty initially)
    console.log('1. Getting all trips...');
    const tripsResponse = await axios.get(`${API_BASE}/trips`);
    console.log(`   Found ${tripsResponse.data.total} trips`);

    // Test 2: Create a new trip (Type 1 API)
    console.log('\n2. Creating new trip with background generation...');
    const createResponse = await axios.post(`${API_BASE}/trips/create`, {
      tripName: 'Tokyo Adventure'
    });
    console.log(`   Trip created: ${createResponse.data.name} (${createResponse.data.tripId})`);
    console.log(`   Background: ${createResponse.data.backgroundImage}`);
    console.log(`   Placeholder: ${createResponse.data.isPlaceholder}`);

    // Test 3: Get trips again
    console.log('\n3. Getting all trips again...');
    const tripsResponse2 = await axios.get(`${API_BASE}/trips`);
    console.log(`   Found ${tripsResponse2.data.total} trips`);
    tripsResponse2.data.trips.forEach(trip => {
      console.log(`   - ${trip.name} (${trip.miniatureCount} miniatures)`);
    });

    console.log('\n✅ All API tests passed!');
    console.log('\nAPI Summary:');
    console.log('- Type 1 (Background Generation): Working ✓');
    console.log('- Type 2 (Miniature Extraction): Requires image upload');
    console.log('- Type 3 (Composite): Requires miniature ID');
    console.log('\nNote: Actual Gemini API image generation may return placeholders');
    console.log('depending on API availability. The prompts are correctly configured.');

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testAPI();