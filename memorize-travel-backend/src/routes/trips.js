const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../models/dataStore');
const geminiService = require('../services/geminiService');
const storageService = require('../services/storageService');
const elevenLabsService = require('../services/elevenLabsService');

// POST /api/trips/create - Create a new trip with generated background
router.post('/create', async (req, res) => {
  try {
    const { tripName, startDate, endDate, backgroundType = 'sand' } = req.body;
    const tripId = `trip_${uuidv4()}`;
    
    console.log(`Creating new trip: ${tripId} with ${backgroundType} background`);
    
    // Generate background using Gemini API
    let imageBuffer;
    let isPlaceholder = false;
    
    try {
      const result = await geminiService.generateBackground(backgroundType);
      
      if (result.placeholder || !result.imageData) {
        // Use placeholder for testing
        console.log('Using placeholder background for testing');
        imageBuffer = await storageService.createPlaceholderBackground();
        isPlaceholder = true;
      } else {
        // Convert base64 to buffer
        imageBuffer = Buffer.from(result.imageData, 'base64');
      }
    } catch (error) {
      console.error('Error with Gemini API, using placeholder:', error);
      imageBuffer = await storageService.createPlaceholderBackground();
      isPlaceholder = true;
    }
    
    // Save generated image
    const imagePaths = await storageService.saveTripBackground(tripId, imageBuffer);
    console.log(`📁 Background saved to: public${imagePaths.backgroundImage}`);
    
    // Create trip in data store
    const trip = dataStore.createTrip({
      id: tripId,
      name: tripName || `Trip ${dataStore.getAllTrips().length + 1}`,
      backgroundImage: imagePaths.backgroundImage,
      currentBackground: imagePaths.currentBackground,
      startDate: startDate || null,
      endDate: endDate || null
    });
    
    console.log(`Trip created successfully: ${tripId}`);
    
    res.json({
      tripId: trip.id,
      name: trip.name,
      backgroundImage: trip.backgroundImage,
      currentBackground: trip.currentBackground,
      startDate: trip.startDate,
      endDate: trip.endDate,
      createdAt: trip.createdAt,
      isPlaceholder, // Let frontend know if using placeholder
      debugInfo: {
        prompt: 'Type 1 - Background generation',
        images: {
          background: trip.backgroundImage,
          current: trip.currentBackground
        },
        apiCall: 'geminiService.generateBackground'
      }
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to create trip. Please try again.' 
    });
  }
});

// GET /api/trips - Get all trips
router.get('/', async (req, res) => {
  try {
    const trips = dataStore.getAllTrips();
    
    // Format response - include segments and segmentMapping
    const formattedTrips = trips.map(trip => ({
      tripId: trip.id,
      name: trip.name,
      currentBackground: trip.currentBackground,
      miniatureCount: trip.miniatures.length,
      segments: trip.segments || [],
      segmentMapping: trip.segmentMapping || {},
      startDate: trip.startDate,
      endDate: trip.endDate,
      createdAt: trip.createdAt,
      isFinalized: trip.isFinalized || false,
      backgroundMusic: trip.backgroundMusic || null
    }));
    
    res.json({ 
      trips: formattedTrips,
      total: formattedTrips.length
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to fetch trips' 
    });
  }
});

// GET /api/trips/:tripId - Get single trip details
router.get('/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = dataStore.getTrip(tripId);
    
    if (!trip) {
      return res.status(404).json({ 
        error: true, 
        message: 'Trip not found' 
      });
    }
    
    res.json({
      tripId: trip.id,
      name: trip.name,
      backgroundImage: trip.backgroundImage,
      currentBackground: trip.currentBackground,
      miniatures: trip.miniatures,
      segments: trip.segments || [],
      segmentMapping: trip.segmentMapping || {},
      startDate: trip.startDate,
      endDate: trip.endDate,
      createdAt: trip.createdAt,
      isFinalized: trip.isFinalized || false,
      backgroundMusic: trip.backgroundMusic || null
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to fetch trip details' 
    });
  }
});

// POST /api/trips/:tripId/finalize - Finalize a trip with enhanced background
router.post('/:tripId/finalize', async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = dataStore.getTrip(tripId);
    
    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        error: true, 
        message: 'Trip not found' 
      });
    }
    
    console.log(`🎨 Finalizing trip: ${tripId}`);
    console.log(`📊 Trip details: Name="${trip.name}", Dates="${trip.startDate}" to "${trip.endDate}"`);
    
    // STEP 0: Get the current background image
    console.log(`\n📸 [STEP 0] Loading current background image...`);
    const currentBackgroundPath = `public${trip.currentBackground}`;
    const currentBackgroundBuffer = await storageService.readImage(currentBackgroundPath);
    console.log(`✅ Current background loaded (${currentBackgroundBuffer.length} bytes)`);
    
    // Calculate season for context
    const startDate = new Date(trip.startDate);
    const month = startDate.getMonth();
    let season = '';
    if (month >= 2 && month <= 4) season = 'Spring';
    else if (month >= 5 && month <= 7) season = 'Summer';
    else if (month >= 8 && month <= 10) season = 'Autumn';
    else season = 'Winter';
    
    const location = trip.name || 'the journey';
    const seasonLocation = `${season} of ${location}`;
    
    // STEP 1: Extract keywords using Gemini 2.5 Flash
    console.log(`\n🔍 [STEP 1] Extracting keywords from image with Gemini...`);
    console.log(`   - Trip: ${trip.name}`);
    console.log(`   - Season: ${season}`);
    console.log(`   - Dates: ${trip.startDate} to ${trip.endDate}`);
    
    // This happens inside elevenLabsService.generateBackgroundMusic -> geminiService.generateMusicPrompt
    // We'll call it here first to show the process clearly
    let musicPrompt;
    try {
      musicPrompt = await geminiService.generateMusicPrompt(
        trip.name,
        trip.startDate,
        trip.endDate,
        currentBackgroundBuffer
      );
      console.log(`✅ Keywords extracted: "${musicPrompt}"`);
    } catch (error) {
      console.error(`❌ Keyword extraction failed:`, error);
      musicPrompt = null;
    }
    
    // STEP 2: Generate background music using extracted keywords
    console.log(`\n🎵 [STEP 2] Generating background music with ElevenLabs...`);
    let musicUrl = null;
    try {
      // Note: This will call generateMusicPrompt again internally, but that's okay
      const musicResult = await elevenLabsService.generateBackgroundMusic(
        trip.name, 
        trip.startDate, 
        trip.endDate, 
        currentBackgroundBuffer,
        tripId
      );
      
      // Check if music generation was successful
      if (musicResult && musicResult.success === false) {
        console.log(`⚠️ Music generation skipped: ${musicResult.message}`);
        musicUrl = null;
      } else if (typeof musicResult === 'string') {
        musicUrl = musicResult;
        console.log(`✅ Music generated and saved: ${musicUrl}`);
      } else if (musicResult && musicResult.musicPath) {
        musicUrl = musicResult.musicPath;
        console.log(`✅ Music generated and saved: ${musicUrl}`);
      }
    } catch (error) {
      console.error(`❌ Music generation failed:`, error);
      musicUrl = null;
    }
    
    // STEP 3: Enhance background with seasonal elements
    console.log(`\n🌸 [STEP 3] Enhancing background scenery with Gemini...`);
    const enhancedPrompt = `Edit around the tile, isometric 3D render (orthographic projection, 45° bird's-eye view) depicting "${seasonLocation}." Match the base image's style and motifs (palette, geometry simplification, shading, line weight). Place lightly simplified iconic elements of "${seasonLocation}" near each of the four corners of the image. Do not cover any of the tile or elements on it. Fill remaining gaps with small motifs consistent with the style. No borders, text, logos.`;
    
    console.log(`   - Enhancement prompt: ${enhancedPrompt.substring(0, 100)}...`);
    
    let enhancedImageBuffer;
    try {
      const result = await geminiService.enhanceBackground(
        currentBackgroundBuffer,
        enhancedPrompt
      );
      
      if (result.imageData) {
        enhancedImageBuffer = Buffer.from(result.imageData, 'base64');
        console.log(`✅ Background enhanced successfully (${enhancedImageBuffer.length} bytes)`);
      } else {
        console.log('⚠️ Enhancement returned no data, using current background');
        enhancedImageBuffer = currentBackgroundBuffer;
      }
    } catch (error) {
      console.error(`❌ Background enhancement failed:`, error);
      enhancedImageBuffer = currentBackgroundBuffer;
    }
    
    // Save the enhanced background
    console.log(`\n💾 Saving finalized assets...`);
    const finalizedPath = await storageService.saveFinalizedBackground(tripId, enhancedImageBuffer);
    console.log(`✅ Finalized background saved: ${finalizedPath}`);
    
    // Update trip in data store
    dataStore.updateTrip(tripId, {
      isFinalized: true,
      finalizedBackground: finalizedPath,
      currentBackground: finalizedPath,
      backgroundMusic: musicUrl,
      finalizedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      tripId: tripId,
      finalizedBackground: finalizedPath,
      backgroundMusic: musicUrl,
      message: 'Trip finalized successfully'
    });
    
  } catch (error) {
    console.error('Error finalizing trip:', error);
    res.status(500).json({ 
      success: false,
      error: true, 
      message: 'Failed to finalize trip' 
    });
  }
});

module.exports = router;