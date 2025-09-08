const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../models/dataStore');
const geminiService = require('../services/geminiService');
const storageService = require('../services/storageService');
const segmentationService = require('../services/segmentationService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

// POST /api/miniatures/generate - Generate miniature from uploaded photo
router.post('/generate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: true, 
        message: 'Please upload an image file' 
      });
    }

    const { tripId } = req.body;
    
    if (!tripId) {
      return res.status(400).json({ 
        error: true, 
        message: 'Trip ID is required' 
      });
    }

    // Verify trip exists
    const trip = dataStore.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ 
        error: true, 
        message: 'Trip not found' 
      });
    }

    // Generate IDs
    const photoId = `photo_${uuidv4()}`;
    const miniatureId = `mini_${uuidv4()}`;
    console.log(`🎨 Generate miniature for trip_${tripId.slice(-6)}`);

    // Save original photo
    const originalPath = await storageService.saveOriginal(
      photoId, 
      req.file.buffer, 
      req.file.mimetype
    );
    console.log(`📁 Original: ${originalPath}`);

    // Generate miniature using Gemini API
    let miniatureBuffer;

    try {
      // Get full path for the saved original
      const fullOriginalPath = await storageService.getFullPath(originalPath);
      const result = await geminiService.extractMiniature(fullOriginalPath);
      
      if (!result.imageData) {
        throw new Error('No miniature data returned from API');
      }
      
      miniatureBuffer = Buffer.from(result.imageData, 'base64');
    } catch (error) {
      console.error('❌ Failed to generate miniature:', error.message);
      // Clean up the saved original photo since miniature generation failed
      try {
        await storageService.deleteFile(originalPath);
      } catch (deleteError) {
        console.error('Failed to delete original photo:', deleteError);
      }
      throw new Error(`Failed to generate miniature: ${error.message}`);
    }

    // Save miniature
    const miniaturePath = await storageService.saveMiniature(miniatureId, miniatureBuffer);
    console.log(`📁 Miniature: ${miniaturePath}`);

    // Store miniature data
    const miniature = dataStore.createMiniature({
      id: miniatureId,
      tripId: tripId,
      originalImage: originalPath,
      miniatureImage: miniaturePath
    });

    console.log(`✅ Miniature ready: mini_${miniatureId.slice(-6)}`);

    res.json({
      miniatureId: miniature.id,
      miniatureImage: miniature.miniatureImage,
      originalImage: miniature.originalImage,
      debugInfo: {
        prompt: 'Type 2 - Miniature extraction',
        images: {
          original: originalPath,
          miniature: miniaturePath
        },
        apiCall: 'geminiService.extractMiniature'
      }
    });
  } catch (error) {
    console.error('Error generating miniature:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Failed to generate miniature' 
    });
  }
});

// POST /api/miniatures/add-to-world - Composite miniature onto trip background
router.post('/add-to-world', async (req, res) => {
  try {
    const { tripId, miniatureId, backgroundImage } = req.body;

    if (!tripId || !miniatureId) {
      return res.status(400).json({ 
        error: true, 
        message: 'Trip ID and Miniature ID are required' 
      });
    }

    // Get trip and miniature data
    const trip = dataStore.getTrip(tripId);
    const miniature = dataStore.getMiniature(miniatureId);

    if (!trip) {
      return res.status(404).json({ 
        error: true, 
        message: 'Trip not found' 
      });
    }

    if (!miniature) {
      return res.status(404).json({ 
        error: true, 
        message: 'Miniature not found' 
      });
    }

    console.log(`➕ Add: mini_${miniatureId.slice(-6)} to trip_${tripId.slice(-6)}`);

    // Use the backgroundImage from frontend if provided, otherwise use trip's current background
    const backgroundToUse = backgroundImage || trip.currentBackground;

    // Get full paths
    const miniaturePath = await storageService.getFullPath(miniature.miniatureImage);
    const backgroundPath = await storageService.getFullPath(backgroundToUse);

    // Composite images using Gemini API
    let compositeBuffer;
    let isPlaceholder = false;

    try {
      const result = await geminiService.compositeImages(miniaturePath, backgroundPath);
      
      if (!result.imageData) {
        throw new Error('No image data returned from API');
      }
      
      compositeBuffer = Buffer.from(result.imageData, 'base64');
      isPlaceholder = result.placeholder || false;
    } catch (error) {
      console.error('❌ Failed to composite images:', error.message);
      throw new Error(`Failed to add miniature to world: ${error.message}`);
    }

    // Save composite as a candidate (NOT directly as current)
    const newBackgroundPath = await storageService.saveCompositeCandidate(tripId, compositeBuffer);
    console.log(`📁 Composite: ${newBackgroundPath}`);

    res.json({
      success: true,
      newBackground: newBackgroundPath,
      miniatureCount: trip.miniatures.length + 1,
      isPlaceholder, // Let frontend know if using placeholder
      debugInfo: {
        prompt: 'Type 3',
        images: {
          miniature: miniature.miniatureImage,
          background: backgroundToUse,
          result: newBackgroundPath
        }
      }
    });
  } catch (error) {
    console.error('Error adding miniature to world:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Failed to add miniature to world' 
    });
  }
});

// POST /api/miniatures/regenerate - Regenerate composite with same miniature
router.post('/regenerate', async (req, res) => {
  try {
    const { tripId, miniatureId, previousBackground } = req.body;

    if (!tripId || !miniatureId) {
      return res.status(400).json({ 
        error: true, 
        message: 'Trip ID and Miniature ID are required' 
      });
    }

    // Get trip and miniature data
    const trip = dataStore.getTrip(tripId);
    const miniature = dataStore.getMiniature(miniatureId);

    if (!trip) {
      return res.status(404).json({ 
        error: true, 
        message: 'Trip not found' 
      });
    }

    if (!miniature) {
      return res.status(404).json({ 
        error: true, 
        message: 'Miniature not found' 
      });
    }

    console.log(`🔄 Regenerate: mini_${miniatureId.slice(-6)} on trip_${tripId.slice(-6)}`);

    // Use the previousBackground from frontend if provided
    // Otherwise fallback to trip's current background (though this shouldn't happen)
    const backgroundToUse = previousBackground || trip.currentBackground;

    // Get full paths
    const miniaturePath = await storageService.getFullPath(miniature.miniatureImage);
    const backgroundPath = await storageService.getFullPath(backgroundToUse);

    // Regenerate composite using Gemini API with slight variation
    let compositeBuffer;
    let isPlaceholder = false;

    try {
      // Add a random seed or variation parameter to get different results
      const result = await geminiService.compositeImages(
        miniaturePath, 
        backgroundPath,
        { regenerate: true, seed: Date.now() }
      );
      
      if (!result.imageData) {
        throw new Error('No image data returned from API');
      }
      
      compositeBuffer = Buffer.from(result.imageData, 'base64');
      isPlaceholder = result.placeholder || false;
    } catch (error) {
      console.error('❌ Failed to regenerate composite:', error.message);
      throw new Error(`Failed to regenerate composite: ${error.message}`);
    }

    // Create new background path for regenerated composite
    const newBackgroundPath = await storageService.saveRegeneratedComposite(
      tripId, 
      compositeBuffer,
      `regen_${Date.now()}`
    );
    console.log(`🔄 Regenerated: ${newBackgroundPath}`);

    res.json({
      success: true,
      newBackground: newBackgroundPath,
      isPlaceholder, // Let frontend know if using placeholder
      debugInfo: {
        prompt: 'Type 3 (regen)',
        images: {
          miniature: miniature.miniatureImage,
          background: previousBackground,
          result: newBackgroundPath
        }
      }
    });
  } catch (error) {
    console.error('Error regenerating composite:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Failed to regenerate composite' 
    });
  }
});

// POST /api/miniatures/confirm - Confirm composite as new background and perform segmentation
router.post('/confirm', async (req, res) => {
  try {
    const { tripId, compositePath, miniatureData, previousBackground } = req.body;

    if (!tripId || !compositePath) {
      return res.status(400).json({ 
        error: true, 
        message: 'Trip ID and composite path are required' 
      });
    }

    // Get trip data
    const trip = dataStore.getTrip(tripId);
    if (!trip) {
      return res.status(404).json({ 
        error: true, 
        message: 'Trip not found' 
      });
    }

    // Get previously accumulated segments
    const previousSegmentData = dataStore.getTripSegments(tripId);
    let allSegments = [...(previousSegmentData.segments || [])];
    let allOriginalImages = { ...(previousSegmentData.segmentMapping || {}) };
    
    // IMPORTANT: Perform segmentation to find NEW miniature
    let newSegments = [];
    
    try {
      // For first miniature, use the original empty background from the trip
      // For subsequent miniatures, use the previousBackground passed from frontend
      let backgroundForComparison = previousBackground;
      
      // If no previousBackground provided (first miniature case), use the original background
      if (!backgroundForComparison && trip.originalBackground) {
        backgroundForComparison = trip.originalBackground;
        console.log('📍 First miniature - using original background for comparison');
      } else if (!backgroundForComparison) {
        // Fallback to current background if available
        backgroundForComparison = trip.currentBackground;
      }
      
      console.log('🔍 Segmentation check:');
      console.log(`  backgroundForComparison: ${backgroundForComparison}`);
      console.log(`  compositePath: ${compositePath}`);
      console.log(`  Are they different?: ${backgroundForComparison !== compositePath}`);
      console.log(`  Previously accumulated segments: ${allSegments.length}`);
      
      if (backgroundForComparison && backgroundForComparison !== compositePath) {
        const fullCompositePath = await storageService.getFullPath(compositePath);
        const fullPreviousPath = await storageService.getFullPath(backgroundForComparison);
        
        console.log(`🔍 Comparing images for segmentation:`);
        console.log(`  New composite full path: ${fullCompositePath}`);
        console.log(`  Previous background full path: ${fullPreviousPath}`);
        
        // Use CV2-based segmentation to find differences (current image, previous image)
        const segmentationResult = await segmentationService.segmentImage(fullCompositePath, fullPreviousPath);
        
        if (segmentationResult && segmentationResult.segments) {
          newSegments = segmentationResult.segments;
          console.log(`🔍 CV2 Segmentation found ${newSegments.length} NEW objects`);
          
          // Add new segments to accumulated segments
          newSegments.forEach((segment, index) => {
            // Generate unique ID for accumulated segment - use existing segment count as offset
            const uniqueId = `seg_${allSegments.length + index + 1}_${Date.now()}`;
            const accumulatedSegment = {
              ...segment,
              id: uniqueId
            };
            allSegments.push(accumulatedSegment);
            
            // Map this new segment to the current miniature's original image
            if (miniatureData && miniatureData.miniatureId) {
              const miniature = dataStore.getMiniature(miniatureData.miniatureId);
              if (miniature && miniature.originalImage) {
                allOriginalImages[accumulatedSegment.id] = miniature.originalImage;
                console.log(`📍 Mapped segment ${accumulatedSegment.id} to original image: ${miniature.originalImage}`);
              }
            }
          });
        } else {
          console.log('⚠️ No segments found in segmentation result');
        }
      } else {
        console.log('⚠️ Cannot perform segmentation - backgrounds are the same or missing');
        console.log(`  Reason: backgroundForComparison=${backgroundForComparison}, compositePath=${compositePath}`);
      }
    } catch (segError) {
      console.error('CV2 Segmentation error:', segError);
      // Continue without segmentation data
    }
    
    // Add the current miniature to the trip
    if (miniatureData && miniatureData.miniatureId) {
      const miniature = dataStore.getMiniature(miniatureData.miniatureId);
      if (miniature) {
        dataStore.addMiniatureToTrip(tripId, miniature);
        
        // Store accumulated segments in dataStore
        // Note: We need to store the segments with their unique IDs
        const segmentsToStore = newSegments.map((segment, index) => ({
          ...segment,
          id: `seg_${previousSegmentData.segments.length + index + 1}_${Date.now()}`
        }));
        
        segmentsToStore.forEach(segment => {
          dataStore.updateTripSegments(tripId, segment, miniature.originalImage);
        });
      }
    }
    
    // NOW confirm the composite as the new current background AFTER segmentation
    const newCurrentPath = await storageService.confirmComposite(tripId, compositePath);
    console.log(`✅ Confirmed: ${compositePath} → current`);
    
    dataStore.updateTrip(tripId, {
      currentBackground: newCurrentPath
    });

    res.json({
      success: true,
      currentBackground: newCurrentPath,
      segments: allSegments, // Return ALL accumulated segmentation data
      originalImages: allOriginalImages // Return mapping of ALL segment IDs to original images
    });
  } catch (error) {
    console.error('Error confirming composite:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message || 'Failed to confirm composite' 
    });
  }
});

// GET /api/miniatures/trip/:tripId - Get all miniatures for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const miniatures = dataStore.getMiniaturesByTrip(tripId);
    
    res.json({
      miniatures: miniatures,
      total: miniatures.length
    });
  } catch (error) {
    console.error('Error fetching miniatures:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to fetch miniatures' 
    });
  }
});

module.exports = router;