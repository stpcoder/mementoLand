const fs = require('fs');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

console.log('🔑 API Key configured:', ELEVEN_API_KEY ? `Yes (${ELEVEN_API_KEY.substring(0, 10)}...)` : 'No');

async function composeJazzBgm({
  prompt = "gentle lounge jazz trio, brushed drums, upright bass, warm electric piano, instrumental only, loop-friendly",
  ms = 10000,                          // 최소 10초
  format = "mp3_44100_128",            // 품질/용량 균형
} = {}) {
  const url = `https://api.elevenlabs.io/v1/music?output_format=${format}`;
  
  console.log('🎵 Calling ElevenLabs Music API...');
  console.log('URL:', url);
  console.log('Prompt:', prompt);
  console.log('Duration:', ms, 'ms');
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: ms,
      model_id: "music_v1",
    }),
  });
  
  console.log('Response status:', res.status);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Error response:', errorText);
    throw new Error(`Music compose failed: ${res.status} ${errorText}`);
  }
  
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('✅ Received audio buffer:', buf.length, 'bytes');
  
  fs.writeFileSync("test-bgm.mp3", buf);
  console.log('💾 Saved to test-bgm.mp3');
  
  return "test-bgm.mp3";
}

// finalized 플로우에서 호출
composeJazzBgm()
  .then(file => {
    console.log('✅ Success! Generated:', file);
    console.log('File size:', fs.statSync(file).size, 'bytes');
  })
  .catch(error => {
    console.error('❌ Failed:', error.message);
    if (error.message.includes('401')) {
      console.log('💡 API key may be invalid or not configured');
    } else if (error.message.includes('402')) {
      console.log('💡 API quota may be exceeded or subscription issue');
    } else if (error.message.includes('404')) {
      console.log('💡 Music API endpoint may not be available');
    }
  });