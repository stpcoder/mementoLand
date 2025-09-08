require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs').promises;
const path = require('path');

async function testGeminiPrompt() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Test with gemini-2.0-flash-exp model instead
  const textModel = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 200,
    },
  });

  const tripName = "San Francisco";
  const startDate = "2024-03-15";
  const endDate = "2024-03-20";
  const season = "Spring";

  const prompt = `You are a music prompt generator for travel memories. 
  Based on this travel information:
  - Trip Title: ${tripName}
  - Season: ${season}
  - Travel Period: ${startDate} to ${endDate}
  
  Generate a short, descriptive music prompt (max 50 words) for a 10-second instrumental background music that captures:
  1. The travel destination's cultural musical elements
  2. The seasonal atmosphere
  3. Nostalgic, emotional travel memory feeling
  4. Gentle, ambient, loop-friendly characteristics
  
  Focus on musical instruments, mood, and atmosphere. Include "instrumental only, loop-friendly, 10 seconds" at the end.
  Do NOT include any explanations, just return the music prompt directly.`;

  console.log('Testing Gemini prompt generation...');
  console.log('Model:', 'gemini-2.0-flash-exp');
  console.log('Trip:', tripName);
  console.log('Season:', season);
  console.log('\nPrompt sent to Gemini:');
  console.log(prompt);
  console.log('\n---\n');

  try {
    // Test without image first
    const resultText = await textModel.generateContent(prompt);
    const responseText = await resultText.response;
    const musicPromptText = responseText.text().trim();
    
    console.log('Response (text only):', musicPromptText);
    console.log('\n---\n');

    // Now test with an image if available
    const testImagePath = path.join(__dirname, 'public/images/trips/trip-1733622051653/land-1733622051653.png');
    
    try {
      const imageData = await fs.readFile(testImagePath);
      const base64Image = imageData.toString('base64');
      
      const image = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      };

      const promptWithImage = prompt + "\n\nAnd looking at the attached travel memory land image (an isometric 3D miniature world with travel mementos),";

      const resultWithImage = await textModel.generateContent([promptWithImage, image]);
      const responseWithImage = await resultWithImage.response;
      const musicPromptWithImage = responseWithImage.text().trim();
      
      console.log('Response (with image):', musicPromptWithImage);
    } catch (imageError) {
      console.log('Could not test with image:', imageError.message);
    }

  } catch (error) {
    console.error('Error generating music prompt:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testGeminiPrompt();