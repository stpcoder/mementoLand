require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');

async function testMusicAPI() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  console.log('\n📡 Testing ElevenLabs Music Generation API...\n');

  // The correct music generation endpoint
  const url = 'https://api.elevenlabs.io/v1/music-generation';
  
  const requestBody = {
    prompt: "peaceful instrumental music, warm summer travel memories, gentle melodies, serene atmosphere",
    make_instrumental: true,
    wait_audio: false
  };

  try {
    console.log('🎵 Sending request to ElevenLabs Music Generation...');
    console.log('URL:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
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
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON
      }
      
      if (response.status === 402) {
        console.error('\n💳 Payment Required - Your plan may not include Music Generation');
      } else if (response.status === 401) {
        console.error('\n🔐 Authentication Failed - API key may be invalid or missing permissions');
      } else if (response.status === 404) {
        console.error('\n❓ Endpoint not found - Music API may not be available');
      }
    } else {
      console.log('\n✅ Success! Music Generation API is working');
      const responseData = await response.json();
      console.log('Response data:', JSON.stringify(responseData, null, 2));
      
      // If there's an audio URL, download it
      if (responseData.audio_url) {
        console.log('🎵 Downloading audio from:', responseData.audio_url);
        const audioResponse = await fetch(responseData.audio_url);
        const buffer = await audioResponse.buffer();
        
        const testPath = './test-music-generated.mp3';
        fs.writeFileSync(testPath, buffer);
        console.log('💾 Generated music saved to:', testPath);
      }
    }
  } catch (error) {
    console.error('\n🔥 Error calling ElevenLabs Music API:', error.message);
    console.error('Full error:', error);
  }
}

// Also test with the original endpoint format
async function testOriginalMusicEndpoint() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('\n\n📡 Testing Original Music Endpoint Format...\n');

  const url = 'https://api.elevenlabs.io/v1/music';
  
  const requestBody = {
    text: "peaceful instrumental music, warm summer travel memories, gentle melodies, serene atmosphere",
    model_id: "music-generation-v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  };

  try {
    console.log('🎵 Sending request to /v1/music...');
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
    } else {
      console.log('✅ Success!');
      const buffer = await response.buffer();
      console.log('🎵 Received audio data:', buffer.length, 'bytes');
      
      const testPath = './test-music-v1.mp3';
      fs.writeFileSync(testPath, buffer);
      console.log('💾 Music saved to:', testPath);
    }
  } catch (error) {
    console.error('🔥 Error:', error.message);
  }
}

// Run tests
(async () => {
  await testMusicAPI();
  await testOriginalMusicEndpoint();
})();