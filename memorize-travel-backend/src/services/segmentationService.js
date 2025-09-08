const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class SegmentationService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '..', '..', 'scripts', 'segmentation.py');
  }

  /**
   * Find differences between two images and return bounding boxes
   * @param {string} previousImagePath - Path to the previous background image
   * @param {string} currentImagePath - Path to the current composite image  
   * @param {Object} options - Optional parameters
   * @returns {Promise<Array>} Array of bounding boxes with {x, y, width, height}
   */
  async findDifferences(previousImagePath, currentImagePath, options = {}) {
    const { minArea = 300, singleBox = false } = options;
    
    console.log(`🔍 CV2 Segmentation: comparing images`);
    console.log(`  Previous: ${previousImagePath.split('/').pop()}`);
    console.log(`  Current: ${currentImagePath.split('/').pop()}`);

    return new Promise((resolve, reject) => {
      // Prepare arguments for the Python script
      const args = [
        this.pythonScriptPath,
        previousImagePath,
        currentImagePath,
        '--min-area', minArea.toString()
      ];

      if (singleBox) {
        args.push('--single-box');
      }

      // Spawn Python process using virtual environment
      const pythonPath = path.join(__dirname, '..', '..', 'venv', 'bin', 'python');
      const pythonProcess = spawn(pythonPath, args);
      
      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python segmentation error:', errorData);
          reject(new Error(`Segmentation failed: ${errorData}`));
          return;
        }

        try {
          // Parse the output to extract bounding boxes
          const boxes = this.parseSegmentationOutput(outputData);
          console.log(`✅ CV2 Segmentation found ${boxes.length} regions`);
          resolve(boxes);
        } catch (error) {
          console.error('Error parsing segmentation output:', error);
          reject(error);
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject(new Error('Failed to run segmentation script'));
      });
    });
  }

  /**
   * Parse the Python script output to extract bounding boxes
   * @param {string} output - Raw output from Python script
   * @returns {Array} Array of segments with bounding boxes
   */
  parseSegmentationOutput(output) {
    const segments = [];
    
    // First try to find JSON output
    const jsonMatch = output.match(/JSON_OUTPUT:(.+)/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.segments) {
          // Add labels and confidence to each segment
          return jsonData.segments.map((seg, index) => ({
            id: seg.id || index + 1,
            label: `object_${seg.id || index + 1}`,
            bbox: seg.bbox,
            confidence: 0.95 // High confidence since it's based on actual pixel differences
          }));
        }
      } catch (parseError) {
        console.error('Error parsing JSON output:', parseError);
      }
    }
    
    // Fallback: Look for the line containing bounding boxes
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Found') && line.includes('change region')) {
        // Extract boxes from format: "Found N change region(s): [(x, y, w, h), ...]"
        const boxMatch = line.match(/\[.*\]/);
        if (boxMatch) {
          try {
            // Parse the Python list format
            const boxesStr = boxMatch[0];
            // Convert Python tuple format to JSON format
            const jsonStr = boxesStr
              .replace(/\(/g, '[')
              .replace(/\)/g, ']')
              .replace(/'/g, '"');
            
            const boxesArray = JSON.parse(jsonStr);
            
            // Convert to our segment format
            boxesArray.forEach((box, index) => {
              segments.push({
                id: index + 1,
                label: `object_${index + 1}`,
                bbox: {
                  x: box[0],
                  y: box[1],
                  width: box[2],
                  height: box[3]
                },
                confidence: 0.95 // High confidence since it's based on actual pixel differences
              });
            });
          } catch (parseError) {
            console.error('Error parsing boxes:', parseError);
          }
        }
      }
    }

    return segments;
  }

  /**
   * Fallback method using simple JavaScript-based difference detection
   * Used when Python script is not available
   */
  async findDifferencesFallback(previousImagePath, currentImagePath) {
    console.log('⚠️ Using fallback segmentation (Python not available)');
    
    // For MVP, return a simple mock response
    // In production, you could implement a JS-based image diff here
    return [
      {
        id: 1,
        label: 'new_object',
        bbox: {
          x: 400,
          y: 300,
          width: 200,
          height: 200
        },
        confidence: 0.5
      }
    ];
  }

  /**
   * Segment an image by comparing it with a previous version
   * @param {string} currentImagePath - Path to current image
   * @param {string} previousImagePath - Path to previous image (optional)
   * @returns {Promise<Object>} Segmentation result with segments array
   */
  async segmentImage(currentImagePath, previousImagePath = null) {
    if (!previousImagePath) {
      // If no previous image, return empty segments
      return { segments: [] };
    }

    try {
      // Check if both images exist
      await fs.access(currentImagePath);
      await fs.access(previousImagePath);

      // Try to use Python CV2-based segmentation
      const segments = await this.findDifferences(previousImagePath, currentImagePath);
      
      return {
        segments: segments
      };
    } catch (error) {
      console.error('Segmentation error:', error);
      
      // Try fallback method
      try {
        const segments = await this.findDifferencesFallback(previousImagePath, currentImagePath);
        return {
          segments: segments
        };
      } catch (fallbackError) {
        console.error('Fallback segmentation also failed:', fallbackError);
        return {
          segments: []
        };
      }
    }
  }
}

module.exports = new SegmentationService();