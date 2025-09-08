const segmentationService = require('./src/services/segmentationService');
const path = require('path');

async function testCV2() {
  console.log('Testing CV2 segmentation...');
  
  // Test with placeholder images for now
  const testImage1 = path.join(__dirname, 'public', 'images', 'placeholder-bg.png');
  const testImage2 = path.join(__dirname, 'public', 'images', 'placeholder-mini.png');
  
  try {
    const result = await segmentationService.segmentImage(testImage1, testImage2);
    console.log('Segmentation result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCV2();