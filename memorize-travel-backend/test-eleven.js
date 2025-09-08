require('dotenv').config();
const fetch = require('node-fetch');

async function testElevenLabsAPI() {
  const apiKey = process.env.ELEVEN_API_KEY;
  
  console.log('Testing ElevenLabs API...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  
  const url = 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128';
  const prompt = 'gentle lounge jazz for travel memories, spring atmosphere, Tokyo-inspired, instrumental only, loop-friendly, 10 seconds';
  
  console.log('\nRequest URL:', url);
  console.log('Prompt:', prompt);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: 10000,
        model_id: 'music_v1',
      }),
    });
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\nError Response:', errorText);
      
      if (response.status === 402) {
        console.log('\n⚠️ ElevenLabs Music API requires a paid plan');
      }
    } else {
      const buffer = await response.buffer();
      console.log('\n✅ Success! Received audio buffer:', buffer.length, 'bytes');
      
      // Save to test file
      const fs = require('fs').promises;
      await fs.writeFile('test-music.mp3', buffer);
      console.log('✅ Saved to test-music.mp3');
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testElevenLabsAPI();