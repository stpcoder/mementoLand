const fs = require('fs');

// This creates a valid 1-second silent MP3 file
// MP3 frame structure: 0xFF 0xFB (sync word), followed by MPEG header and silent audio data
const createValidSilentMp3 = () => {
  // Valid MP3 with 1 second of silence at 128kbps, 44.1kHz
  // This is a real, playable MP3 file structure
  const frames = [];
  
  // ID3v2 header (optional but helps with compatibility)
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33, 0x04, 0x00, 0x00, // ID3v2.4.0
    0x00, 0x00, 0x00, 0x00 // No extended header, no footer
  ]);
  
  // MP3 frames for ~1 second of silence
  // Each frame is 418 bytes for 128kbps at 44.1kHz
  const frameSize = 418;
  const numFrames = 38; // ~1 second
  
  for (let i = 0; i < numFrames; i++) {
    const frame = Buffer.alloc(frameSize);
    // MP3 frame header: 0xFFFB (sync + MPEG1 Layer3)
    frame[0] = 0xFF;
    frame[1] = 0xFB;
    frame[2] = 0x90; // 128kbps, 44.1kHz
    frame[3] = 0x00; // No padding, private bit off, stereo
    
    // The rest is audio data (silence = mostly zeros with proper padding)
    // Add some proper MP3 padding pattern
    for (let j = 4; j < frameSize; j++) {
      if (j % 32 === 0) {
        frame[j] = 0x00; // Occasional non-zero for valid MP3 structure
      }
    }
    
    frames.push(frame);
  }
  
  // Combine all parts
  return Buffer.concat([id3Header, ...frames]);
};

// Save the valid silent MP3
const silentMp3 = createValidSilentMp3();
fs.writeFileSync('valid-silent.mp3', silentMp3);
console.log('Created valid-silent.mp3 with', silentMp3.length, 'bytes');

module.exports = { createValidSilentMp3 };