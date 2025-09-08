require('dotenv').config();
const fetch = require('node-fetch');

async function testElevenLabsWithPrompt() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('Testing ElevenLabs API with a valid prompt...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  
  const url = 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128';
  
  // 임의의 테스트 prompt
  const testPrompt = 'gentle ambient piano music, relaxing and peaceful, instrumental only, loop-friendly, 10 seconds';
  
  console.log('\nRequest URL:', url);
  console.log('Test Prompt:', testPrompt);
  
  const requestBody = {
    prompt: testPrompt,
    music_length_ms: 10000,
    model_id: 'music_v1',
  };
  
  console.log('\nRequest Body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\nError Response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (response.status === 402) {
          console.log('\n⚠️ ElevenLabs Music API requires a paid plan');
          console.log('Error details:', errorJson.detail);
        } else if (response.status === 422) {
          console.log('\n❌ Request validation failed');
          console.log('Error details:', errorJson.detail);
        }
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
    } else {
      const buffer = await response.buffer();
      console.log('\n✅ Success! Received audio buffer:', buffer.length, 'bytes');
      
      // Save to test file
      const fs = require('fs').promises;
      await fs.writeFile('test-music-with-prompt.mp3', buffer);
      console.log('✅ Saved to test-music-with-prompt.mp3');
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testElevenLabsWithPrompt();