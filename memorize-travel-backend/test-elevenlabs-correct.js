require('dotenv').config();
const fetch = require('node-fetch');

async function testElevenLabsSoundGeneration() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  console.log('\n📡 Testing ElevenLabs Sound Generation API...\n');

  // The correct endpoint for sound generation
  const url = 'https://api.elevenlabs.io/v1/sound-generation';
  
  const requestBody = {
    text: "peaceful instrumental music, warm summer travel memories, gentle melodies, serene atmosphere",
    duration_seconds: 10, // 10 seconds
    prompt_influence: 0.3
  };

  try {
    console.log('🎵 Sending request to ElevenLabs Sound Generation...');
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
      console.error('\n❌ API Error Response:');
      console.error('Status:', response.status);
      console.error('Body:', errorText);
      
      if (response.status === 402) {
        console.error('\n💳 Payment Required - Your plan may not include Sound Generation');
      } else if (response.status === 401) {
        console.error('\n🔐 Authentication Failed - API key may be invalid');
      } else if (response.status === 422) {
        console.error('\n⚠️ Invalid parameters');
      }
    } else {
      console.log('\n✅ Success! Sound Generation API is working');
      const buffer = await response.buffer();
      console.log('🎵 Received audio data:', buffer.length, 'bytes');
      
      // Save test file
      const fs = require('fs');
      const testPath = './test-sound.mp3';
      fs.writeFileSync(testPath, buffer);
      console.log('💾 Test sound saved to:', testPath);
    }
  } catch (error) {
    console.error('\n🔥 Error calling ElevenLabs API:', error.message);
  }
}

// Test the subscription info
async function testSubscription() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('\n📱 Checking Subscription Info...\n');
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Subscription Info:');
      console.log('- Tier:', data.tier || 'N/A');
      console.log('- Character limit:', data.character_limit || 'N/A');
      console.log('- Character count:', data.character_count || 'N/A');
      console.log('- Can use instant voice cloning:', data.can_use_instant_voice_cloning || false);
      console.log('- Can use professional voice cloning:', data.can_use_professional_voice_cloning || false);
      console.log('- Can extend character limit:', data.can_extend_character_limit || false);
      console.log('- Can extend voice limit:', data.can_extend_voice_limit || false);
      console.log('- Has open AI Grant:', data.has_open_ai_grant || false);
      
      if (data.next_character_count_reset_unix) {
        const resetDate = new Date(data.next_character_count_reset_unix * 1000);
        console.log('- Next reset:', resetDate.toLocaleString());
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to get subscription info:', response.status);
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('🔥 Error getting subscription info:', error.message);
  }
}

// Run tests
(async () => {
  await testSubscription();
  await testElevenLabsSoundGeneration();
})();