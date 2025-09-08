const fs = require('fs').promises;
const path = require('path');
const geminiService = require('./geminiService');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVEN_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async generateBackgroundMusic(tripName, startDate, endDate, imageBuffer, tripId) {
    console.log(`🎵 Generating background music for ${tripName}`);
    
    // Use Gemini to generate contextual music prompt based on trip and image
    const prompt = await geminiService.generateMusicPrompt(tripName, startDate, endDate, imageBuffer);
    
    try {
      // Check if API key is configured
      if (!this.apiKey || this.apiKey === 'your_eleven_api_key_here') {
        throw new Error('ElevenLabs API key not configured');
      }

      const url = `https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          music_length_ms: 10000, // 10 seconds
          model_id: 'music_v1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} ${errorText}`);
        
        // Check if it's a payment required error
        if (response.status === 402) {
          console.log('⚠️ ElevenLabs Music API requires a paid plan');
          // Return a placeholder response instead of throwing
          return {
            success: false,
            error: 'paid_plan_required',
            message: 'ElevenLabs Music API requires a paid plan',
            musicPath: null
          };
        }
        
        throw new Error(`Music generation failed: ${response.status} ${errorText}`);
      }

      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Save the music file
      const musicPath = await this.saveMusicFile(tripId, buffer);
      
      console.log(`✅ Background music saved to: ${musicPath}`);
      return musicPath;
      
    } catch (error) {
      console.error('Error generating background music:', error);
      throw error;
    }
  }


  async saveMusicFile(tripId, buffer) {
    const dir = path.join(__dirname, '../../public/images/trips', tripId);
    await fs.mkdir(dir, { recursive: true });
    
    const musicPath = path.join(dir, 'bgm.mp3');
    await fs.writeFile(musicPath, buffer);
    
    return `/images/trips/${tripId}/bgm.mp3`;
  }
}

module.exports = new ElevenLabsService();