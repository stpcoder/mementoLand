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
        console.log('⚠️ ElevenLabs API key not configured - using sample music');
        return await this.useSampleMusic(tripId);
      }

      // ElevenLabs Music API endpoint with format parameter
      const format = 'mp3_44100_128';
      const musicUrl = `https://api.elevenlabs.io/v1/music?output_format=${format}`;
      
      console.log('🎵 Calling ElevenLabs Music API with prompt:', prompt);
      
      const response = await fetch(musicUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          music_length_ms: 10000, // 10 seconds
          model_id: 'music_v1',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} ${errorText}`);
        
        // If API fails for any reason, use sample music
        if (response.status === 401 || response.status === 402 || response.status === 404 || response.status === 422) {
          console.log('⚠️ ElevenLabs Music API not available - using sample music as fallback');
          console.log('Note: Music API may require specific subscription tier or may not be available yet');
          return await this.useSampleMusic(tripId);
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
      // Fallback to sample music
      console.log('⚠️ Using sample music as fallback');
      return await this.useSampleMusic(tripId);
    }
  }

  async useSampleMusic(tripId) {
    // Create a valid playable silent MP3 file
    const silentMp3Buffer = this.createValidSilentMp3();
    
    const musicPath = await this.saveMusicFile(tripId, silentMp3Buffer);
    console.log(`✅ Sample music saved to: ${musicPath}`);
    return musicPath;
  }


  createValidSilentMp3() {
    // This creates a valid 1-second silent MP3 file
    const frames = [];
    
    // ID3v2 header for compatibility
    const id3Header = Buffer.from([
      0x49, 0x44, 0x33, 0x04, 0x00, 0x00, // ID3v2.4.0
      0x00, 0x00, 0x00, 0x00 // No extended header
    ]);
    
    // MP3 frames for ~1 second of silence
    // Each frame is 418 bytes for 128kbps at 44.1kHz
    const frameSize = 418;
    const numFrames = 38; // ~1 second
    
    for (let i = 0; i < numFrames; i++) {
      const frame = Buffer.alloc(frameSize);
      // MP3 frame header
      frame[0] = 0xFF;
      frame[1] = 0xFB;
      frame[2] = 0x90; // 128kbps, 44.1kHz
      frame[3] = 0x00; // Stereo
      
      // Rest is audio data (silence)
      for (let j = 4; j < frameSize; j++) {
        frame[j] = 0x00;
      }
      
      frames.push(frame);
    }
    
    // Combine all parts
    return Buffer.concat([id3Header, ...frames]);
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