const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs').promises;
const sharp = require('sharp');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.MODEL_NAME || "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 1,    // Google AI Studio 기본값
        topP: 0.95,        // 누적 확률 95%까지의 토큰만 고려
        maxOutputTokens: 8192,
      },
    });
  }

  // Type 1: Generate Background
  async generateBackground(backgroundType = 'sand') {
    const grass_prompt = `Isometric 3D render in orthographic projection, 45° bird’s-eye view.

HARD CONSTRAINTS — MUST SATISFY ALL:
• EXACTLY ONE square land tile, centered, occupying ~70% of the frame.
• BACKGROUND LOCK: background is a solid, uniform light neutral gray EXACTLY #F2F2F2 (RGB 242,242,242).
  – No gradients, vignetting, texture, noise, banding, or color drift on background.
  – Background luminance variance ≤ 1% across the frame.
• Do NOT create a second tile, inset tile, inner rim, outline, stacked layers, frames, or any illusion of a duplicate tile.
• No extra objects, text, water, plants, props, particles, or debris.

TILE GEOMETRY & CAMERA:
• Minimalist geometry; perfectly flat top plane; rounded edges with soft bevels; crisp, clean contours.
• Orthographic isometric at 45°; do not change framing, FOV, projection, or perspective.
• Keep the tile fully inside the frame with even margins on all sides.

LIGHTING & SHADING:
• Soft global illumination only; gentle low-contrast gradient across the tile top; subtle edge ambient occlusion.
• NO hard cast shadows, NO specular highlights, NO bloom, NO depth of field.
• Do not alter global exposure or white balance of the background.

MATERIAL THEME (GRASS / SPRING, LOW DETAIL ONLY):
• Surface looks like ultra-short, velvet-like micro-fibers; essentially planar (micro variation only).
• Color palette for the tile top (choose within these ranges; avoid white):
  – Primary green ~ #8FCF78 to #79BA6A (muted spring green), edges/shadows ~ #6EA55A to #5D8F4D.
• The tile must be clearly distinct from the background: luminance/contrast ≥ 15% vs #F2F2F2.
• No tall blades, no clumps, no flowers, no rocks, no patches, no repeating patterns.
• Finish is matte; avoid visible texture noise or high-frequency detail.

NEGATIVE INSTRUCTIONS (FORBID):
• No secondary tiles, inner borders, insets, or drop-shadow tricks that suggest layering.
• No background edits (color change, gradient, noise, blur, sharpen).
• No specular/gloss, no wet sheen, no rim light halos.

OUTPUT:
• High resolution, anti-aliased, single image.
• The only colored surfaces are the tile itself (muted spring green as above) and the locked gray background #F2F2F2.`;
    
    const snow_prompt = `Isometric 3D render in orthographic projection, 45° bird’s-eye view.

HARD CONSTRAINTS — MUST SATISFY ALL:
• EXACTLY ONE square land tile, centered, occupying ~70% of the frame.
• BACKGROUND LOCK: background is a solid, uniform light neutral gray EXACTLY #F2F2F2 (RGB 242,242,242).
  – No gradients, vignetting, texture, noise, banding, or color drift on background.
  – Background luminance variance ≤ 1% across the frame.
• Do NOT create a second tile, inset tile, inner rim, outline, stacked layers, frames, or any illusion of a duplicate tile.
• No extra objects, text, water, plants, props, particles, or debris.

TILE GEOMETRY & CAMERA:
• Minimalist geometry; perfectly flat top plane; rounded edges with soft bevels; crisp, clean contours.
• Orthographic isometric at 45°; do not change framing, FOV, projection, or perspective.
• Keep the tile fully inside the frame with even margins on all sides.

LIGHTING & SHADING:
• Soft global illumination only; gentle low-contrast shading across the tile top; subtle edge ambient occlusion.
• Cool daylight feeling is OK on the tile; NO hard cast shadows, NO specular highlights, NO bloom, NO depth of field.
• Do not alter global exposure or white balance of the locked gray background.

MATERIAL THEME (SNOW / WINTER, LOW DETAIL ONLY):
• Surface looks like fresh, compacted powder snow — smooth, very fine micro-grain; essentially planar (micro variation only).
• Color palette for the tile top (avoid pure white):
  – Cool snow whites ~ #EAF2F8 to #DDEAF5; edges/shadows ~ #C9D7E5 to #B6C7D6 (subtle cool blue-gray).
• The tile must be clearly distinct from the background: luminance/contrast ≥ 15% vs #F2F2F2, with a cool hue bias.
• Finish is matte/soft; no crystalline sparkle or glitter; avoid high-frequency noise or repeating patterns.
• No footprints, tracks, melt puddles, ice crust, dirt, grass, or debris.

NEGATIVE INSTRUCTIONS (FORBID):
• No secondary tiles, inner borders, insets, or drop-shadow tricks that suggest layering.
• No background edits (color change, gradient, noise, blur, sharpen).
• No specular/gloss, no wet sheen, no rim light halos.

OUTPUT:
• High resolution, anti-aliased, single image.
• The only colored surfaces are the tile itself (cool snow whites as above) and the locked gray background #F2F2F2.`;

    const sand_prompt = `Isometric 3D render in orthographic projection, 45° bird’s-eye view.

HARD CONSTRAINTS — MUST SATISFY ALL:
• EXACTLY ONE square land tile, centered, occupying ~70% of the frame.
• BACKGROUND LOCK: background is a solid, uniform light neutral gray EXACTLY #F2F2F2 (RGB 242,242,242).
  – No gradients, vignetting, texture, noise, banding, or color drift on background.
  – Background luminance variance ≤ 1% across the frame.
• Do NOT create a second tile, inset tile, inner rim, outline, stacked layers, frames, or any illusion of a duplicate tile.
• No extra objects, text, water, plants, props, particles, or debris.

TILE GEOMETRY & CAMERA:
• Minimalist geometry; perfectly flat top plane; rounded edges with soft bevels; crisp, clean contours.
• Orthographic isometric at 45°; do not change framing, FOV, projection, or perspective.
• Keep the tile fully inside the frame with even margins on all sides.

LIGHTING & SHADING:
• Soft global illumination only; gentle low-contrast shading across the tile top; subtle edge ambient occlusion.
• Warm daylight feeling is OK on the tile; NO hard cast shadows, NO specular highlights, NO bloom, NO depth of field.
• Do not alter global exposure or white balance of the locked gray background.

MATERIAL THEME (SAND / DESERT, LOW DETAIL ONLY):
• Surface looks like fine, compacted dry sand — smooth micro-grain; essentially planar (micro variation only).
• Color palette for the tile top (avoid pure white):
  – Warm sand beiges ~ #E8D9B8 to #D9C6A0; edges/shadows ~ #C9B48A to #B59C73 (subtle warm tan).
• The tile must be clearly distinct from the background: luminance/contrast ≥ 15% vs #F2F2F2, with a warm hue bias.
• Finish is matte/soft; no wet sheen or sparkle; avoid high-frequency noise, visible grains, dunes, ripples, or repeating patterns.
• No footprints, tracks, shells, pebbles, seaweed, or debris.

NEGATIVE INSTRUCTIONS (FORBID):
• No secondary tiles, inner borders, insets, or drop-shadow tricks that suggest layering.
• No background edits (color change, gradient, noise, blur, sharpen).
• No specular/gloss, no rim light halos.

OUTPUT:
• High resolution, anti-aliased, single image.
• The only colored surfaces are the tile itself (warm sand tones as above) and the locked gray background #F2F2F2.`;

    // Select the appropriate prompt based on backgroundType
    let prompt;
    switch(backgroundType) {
      case 'grass':
        prompt = grass_prompt;
        break;
      case 'snow':
        prompt = snow_prompt;
        break;
      case 'sand':
      default:
        prompt = sand_prompt;
        break;
    }

    console.log(`🎨 Type 1: Background generation with ${backgroundType}`);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Get the generated image data
      const imageData = response.candidates[0]?.content?.parts[0]?.inlineData;
      
      if (!imageData) {
        // For MVP, return a mock response since image generation might not be available
        console.log('⚠️ Using placeholder background');
        return {
          success: true,
          imageData: null,
          placeholder: true
        };
      }

      console.log('✅ Background ready');
      
      return {
        success: true,
        imageData: imageData.data,
        mimeType: imageData.mimeType
      };
    } catch (error) {
      console.error('Error generating background:', error);
      throw new Error('Failed to generate background');
    }
  }

  // Type 2: Extract Miniature from Image
  async extractMiniature(imagePath) {
    const prompt = "Image-to-image edit. Use the provided image as reference. Extract only the main subjects and rebuild them as a small single minimalist 3D asset. Preserve silhouette, pose, proportions. Make the size of the asset very small. Camera: orthographic, slight 3/4 (~35–45°), centered. Style: simplified geometry; rounded edges; matte, smooth surfaces with solid albedo color fills. Color: keep the subjects’ original colors. If unclear, use a limited 2–4 color palette with medium saturation. Lighting: soft, even light; gentle gradient shading tinted by each base color; subtle contact shadow; no harsh shadows. Background: solid green, flat. Output: high resolution, crisp anti-aliased edges; no depth of field or motion blur.";
    console.log(`🔮 Type 2: Extract miniature from ${imagePath.split('/').pop()}`);

    try {
      // Read image file
      const imageData = await fs.readFile(imagePath);
      const base64Image = imageData.toString('base64');

      const image = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, image]);
      const response = await result.response;
      
      // Get the generated image data
      const generatedImageData = response.candidates[0]?.content?.parts[0]?.inlineData;
      
      if (!generatedImageData) {
        console.error('❌ Gemini API did not return miniature image');
        throw new Error('Failed to generate miniature - API returned no image data');
      }

      console.log('✅ Miniature ready');
      
      return {
        success: true,
        imageData: generatedImageData.data,
        mimeType: generatedImageData.mimeType
      };
    } catch (error) {
      console.error('Error extracting miniature:', error);
      throw new Error('Failed to extract miniature');
    }
  }

  // Type 3: Composite Miniature onto Background
  async compositeImages(miniaturePath, backgroundPath, options = {}) {
    // Always use the same prompt for consistency
    // const prompt = "Composite edit. Use the second input image (the square land tile with grey background and the other entities on it) as the base layer only. Do not modify its size, preexisting entities on the tile, framing, or centered position. Extract the figure from the other input image, preserving proportions while scaling it much smaller, positioning it on the tile, adding a faint contact shadow beneath it, then place it somewhere on the square tile";
    const prompt = `You are a precise additive compositor.

INPUTS
- BASE: the scene to keep exactly as-is (a square land tile on a gray background).
- SUBJECT: an object to add as a small handheld miniature (never a background).

GOAL
Add SUBJECT onto BASE while keeping every existing pixel unchanged except where the subject sits.

STRICT RULES
1) Treat SUBJECT strictly as a tiny tabletop miniature. Do not turn it into the scene or background.
2) Place SUBJECT on the tile surface only. Never outside, behind, or below the tile; do not touch the gray backdrop.
3) Do not move, resize, or restyle anything already on BASE. Do not add any new objects besides the SUBJECT.
4) Keep the original framing and tile position exactly the same.

PLACEMENT POLICY (text-only)
- First try to use the **upper-middle area of the tile**.
- If that spot looks occupied, choose the **least crowded empty area** on the tile, avoiding the very edges.
- Center the subject within the chosen empty area.
- Ensure clear negative space all around the subject.

SCALE & LOOK
- Make the subject **visibly smaller than the smallest existing item** on the tile so it reads as a miniature.
- Keep the subject’s proportions and materials consistent with the BASE style.
- Add a soft **contact shadow** directly beneath it, matching BASE lighting (soft left-top light; low opacity).

SAFETY
- If you cannot confidently place the subject on the tile surface, leave BASE unchanged rather than placing it off-tile.

Return the edited image only.`;    

    
    console.log(`🎭 Type 3: Composite ${miniaturePath.split('/').pop()} + ${backgroundPath.split('/').pop()} ${options.regenerate ? '(regen)' : ''}`);

    try {
      // Read both images
      const miniatureData = await fs.readFile(miniaturePath);
      const backgroundData = await fs.readFile(backgroundPath);
      
      const miniatureBase64 = miniatureData.toString('base64');
      const backgroundBase64 = backgroundData.toString('base64');

      const images = [
        {
          inlineData: {
            data: miniatureBase64,
            mimeType: 'image/png'
          }
        },
        {
          inlineData: {
            data: backgroundBase64,
            mimeType: 'image/png'
          }
        }
      ];

      const result = await this.model.generateContent([prompt, ...images]);
      const response = await result.response;
      
      // Get the generated composite image
      const compositeImageData = response.candidates[0]?.content?.parts[0]?.inlineData;
      
      if (!compositeImageData) {
        console.error('❌ Gemini API did not return composite image');
        throw new Error('Failed to generate composite image - API returned no image data');
      }

      console.log('✅ Composite ready');
      
      return {
        success: true,
        imageData: compositeImageData.data,
        mimeType: compositeImageData.mimeType
      };
    } catch (error) {
      console.error('Error compositing images:', error);
      throw new Error('Failed to composite images');
    }
  }

  // Enhance Background - Add natural elements around the tile
  async enhanceBackground(imageBuffer, prompt) {
    console.log('🎨 Enhancing background with natural elements');

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const image = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      };

      const result = await this.model.generateContent([prompt, image]);
      const response = await result.response;
      
      // Get the generated image data
      const enhancedImageData = response.candidates[0]?.content?.parts[0]?.inlineData;
      
      if (!enhancedImageData) {
        console.error('❌ Gemini API did not return enhanced image');
        throw new Error('Failed to generate enhanced background - API returned no image data');
      }

      console.log('✅ Enhanced background ready');
      
      return {
        success: true,
        imageData: enhancedImageData.data,
        mimeType: enhancedImageData.mimeType
      };
    } catch (error) {
      console.error('Error enhancing background:', error);
      throw new Error('Failed to enhance background');
    }
  }

  // Generate Music Prompt - Create contextual music keywords based on trip
  async generateMusicPrompt(tripName, startDate, endDate, imageBuffer) {
    console.log('🎵 Generating music prompt with Gemini');
    
    // Create a different model instance for text generation (using gemini-2.0-flash-exp for text-only)
    const textModel = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 200,
      },
    });

    // Calculate season from dates
    const startMonth = new Date(startDate).getMonth();
    let season = '';
    if (startMonth >= 2 && startMonth <= 4) season = 'Spring';
    else if (startMonth >= 5 && startMonth <= 7) season = 'Summer';
    else if (startMonth >= 8 && startMonth <= 10) season = 'Autumn';
    else season = 'Winter';

    const prompt = `You are a music prompt generator for travel memories. 
    Based on this travel information:
    - Trip Title: ${tripName}
    - Season: ${season}
    - Travel Period: ${startDate} to ${endDate}
    
    And looking at the attached travel memory land image (an isometric 3D miniature world with travel mementos),
    
    Generate a short, descriptive music prompt (max 50 words) for a 10-second instrumental background music that captures:
    1. The travel destination's cultural musical elements
    2. The seasonal atmosphere
    3. Nostalgic, emotional travel memory feeling
    4. Gentle, ambient characteristics
    
    Focus on musical instruments, mood, and atmosphere.
    IMPORTANT: Your prompt MUST end with exactly these words: "
    Do NOT include any explanations, just return the music prompt directly.`;

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const image = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      };

      const result = await textModel.generateContent([prompt, image]);
      const response = await result.response;
      let musicPrompt = response.text().trim();
            
      console.log(`✅ Generated music prompt: ${musicPrompt}`);
      return musicPrompt;
      
    } catch (error) {
      console.error('Error generating music prompt:', error);
      // Fallback to a simple prompt if Gemini fails
      return `gentle ambient travel memories, ${season.toLowerCase()} atmosphere, nostalgic journey, emotional moments, instrumental only, background`;
    }
  }

  // Segment Image - Detect objects and return bounding boxes
  async segmentImage(imagePath) {
    const prompt = `You are a spatial annotator that returns CONSERVATIVE, center-weighted bounding boxes.
Analyze the SCENE image and detect only salient foreground objects.
Exclude supporting surfaces, backgrounds, shadows, and reflections.

Return bounding boxes that are deliberately conservative and centered:
- Define a Center Box (CB) as an axis-aligned rectangle tightly enclosing the object's central mass.
- The CB must lie fully inside the object silhouette and prioritize the dense, central region over peripheral extensions.
- Prefer under-coverage rather than over-coverage when uncertain.
- Do not include more than 8 pixels of background margin at 1024×1024 scale.
- If boundary is ambiguous, contract the box by 4–6% on each side.
- Skip any region whose area exceeds 30% of the scene unless it is clearly the dominant single object.
- Do not return a box for supporting surfaces (e.g., tiles, plates, tables).

Use image size 1024×1024 for coordinates. Coordinates are integers in pixels.
x,y represent the top-left corner of the box.

Return ONLY valid JSON in exactly this format:
{
  "segments": [
    {
      "id": 1,
      "label": "object (or 'unknown')",
      "bbox": {"x": <number>, "y": <number>, "width": <number>, "height": <number>},
      "confidence": <number between 0 and 1>
    }
  ]
}
No extra text.`;

    console.log(`🔍 Segmenting image: ${imagePath.split('/').pop()}`);

    try {
      // Read image file
      const imageData = await fs.readFile(imagePath);
      const base64Image = imageData.toString('base64');

      const image = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png'
        }
      };

      const result = await this.model.generateContent([prompt, image]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw segmentation response:', text);
      
      // Try to parse the JSON response
      try {
        // Extract JSON from the response (it might contain extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const segmentData = JSON.parse(jsonMatch[0]);
          console.log(`✅ Segmentation found ${segmentData.segments?.length || 0} objects`);
          return segmentData;
        }
      } catch (parseError) {
        console.error('Error parsing segmentation JSON:', parseError);
      }

      // Return empty segments if parsing fails
      return {
        segments: []
      };
      
    } catch (error) {
      console.error('Error segmenting image:', error);
      // Return empty segments on error
      return {
        segments: []
      };
    }
  }
}

module.exports = new GeminiService();