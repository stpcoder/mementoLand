require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');

async function testTextToSpeech() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  console.log('\n📡 Testing ElevenLabs Text-to-Speech API...\n');

  // Use a default voice ID (Rachel - a default voice available to all users)
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const requestBody = {
    text: "Welcome to your travel memories. This is a test of the ElevenLabs API.",
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  try {
    console.log('🎵 Sending request to ElevenLabs TTS...');
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
    } else {
      console.log('\n✅ Success! TTS API is working');
      const buffer = await response.buffer();
      console.log('🎵 Received audio data:', buffer.length, 'bytes');
      
      // Save test file
      const testPath = './test-tts.mp3';
      fs.writeFileSync(testPath, buffer);
      console.log('💾 Test TTS saved to:', testPath);
    }
  } catch (error) {
    console.error('\n🔥 Error calling ElevenLabs API:', error.message);
  }
}

// List available voices
async function listVoices() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('\n🎤 Getting available voices...\n');
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Available voices:');
      data.voices.slice(0, 5).forEach(voice => {
        console.log(`- ${voice.name} (${voice.voice_id}): ${voice.labels?.description || 'No description'}`);
      });
      console.log(`... and ${data.voices.length - 5} more voices`);
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to get voices:', response.status);
      console.error('Error:', errorText);
    }
  } catch (error) {
    console.error('🔥 Error getting voices:', error.message);
  }
}

// Run tests
(async () => {
  await listVoices();
  await testTextToSpeech();
})();