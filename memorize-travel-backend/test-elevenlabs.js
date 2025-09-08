require('dotenv').config();
const fetch = require('node-fetch');

async function testElevenLabsAPI() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ELEVEN_API_KEY not found in .env file');
    return;
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  console.log('\n📡 Testing ElevenLabs Music API...\n');

  const url = 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128';
  
  const requestBody = {
    text: "A peaceful, serene instrumental track with gentle melodies. Travel memories, warm summer day, peaceful journey.",
    model_id: "production",
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75
    }
  };

  try {
    console.log('🎵 Sending request to ElevenLabs...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error Response:');
      console.error('Status:', response.status);
      console.error('Body:', errorText);
      
      if (response.status === 402) {
        console.error('\n💳 Payment Required - Your plan may not include Music API access');
        console.error('Please check your ElevenLabs subscription at https://elevenlabs.io/subscription');
      } else if (response.status === 401) {
        console.error('\n🔐 Authentication Failed - API key may be invalid');
      } else if (response.status === 400) {
        console.error('\n⚠️ Bad Request - The API endpoint or parameters may have changed');
      }
    } else {
      console.log('\n✅ Success! Music API is working');
      const buffer = await response.buffer();
      console.log('🎵 Received audio data:', buffer.length, 'bytes');
      
      // Save test file
      const fs = require('fs');
      const testPath = './test-music.mp3';
      fs.writeFileSync(testPath, buffer);
      console.log('💾 Test music saved to:', testPath);
    }
  } catch (error) {
    console.error('\n🔥 Error calling ElevenLabs API:', error.message);
    console.error('Full error:', error);
  }
}

// Also test the user account info
async function testAccountInfo() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('\n📱 Testing Account Info API...\n');
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Account Info Retrieved:');
      console.log('- Email:', userData.email || 'N/A');
      console.log('- Subscription:', userData.subscription?.tier || 'N/A');
      console.log('- Character limit:', userData.subscription?.character_limit || 'N/A');
      console.log('- Character count:', userData.subscription?.character_count || 'N/A');
    } else {
      console.error('❌ Failed to get account info:', response.status);
    }
  } catch (error) {
    console.error('🔥 Error getting account info:', error.message);
  }
}

// Run tests
(async () => {
  await testAccountInfo();
  await testElevenLabsAPI();
})();