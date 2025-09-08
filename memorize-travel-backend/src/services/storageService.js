const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

class StorageService {
  constructor() {
    this.basePath = path.join(__dirname, '../../public/images');
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }

  async saveTripBackground(tripId, imageBuffer) {
    const dir = path.join(this.basePath, 'trips', tripId);
    await this.ensureDirectory(dir);
    
    const backgroundPath = path.join(dir, 'background.png');
    const currentPath = path.join(dir, 'current.png');
    
    // Save as background
    await fs.writeFile(backgroundPath, imageBuffer);
    // Also save as current (initial state)
    await fs.writeFile(currentPath, imageBuffer);
    
    return {
      backgroundImage: `/images/trips/${tripId}/background.png`,
      currentBackground: `/images/trips/${tripId}/current.png`
    };
  }

  async saveMiniature(miniatureId, imageBuffer) {
    const dir = path.join(this.basePath, 'miniatures');
    await this.ensureDirectory(dir);
    
    const filePath = path.join(dir, `${miniatureId}.png`);
    await fs.writeFile(filePath, imageBuffer);
    
    return `/images/miniatures/${miniatureId}.png`;
  }

  async saveOriginal(photoId, fileBuffer, mimetype) {
    const dir = path.join(this.basePath, 'originals');
    await this.ensureDirectory(dir);
    
    const ext = mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = path.join(dir, `${photoId}.${ext}`);
    await fs.writeFile(filePath, fileBuffer);
    
    return `/images/originals/${photoId}.${ext}`;
  }

  async updateTripBackground(tripId, imageBuffer) {
    const dir = path.join(this.basePath, 'trips', tripId);
    await this.ensureDirectory(dir);
    
    const currentPath = path.join(dir, 'current.png');
    
    // Save previous version with timestamp (optional for history)
    const timestamp = Date.now();
    const historyDir = path.join(dir, 'history');
    await this.ensureDirectory(historyDir);
    
    try {
      // Copy current to history before updating
      const currentBuffer = await fs.readFile(currentPath);
      await fs.writeFile(path.join(historyDir, `${timestamp}.png`), currentBuffer);
    } catch (error) {
      // No current file yet, that's okay
    }
    
    // Update current background
    await fs.writeFile(currentPath, imageBuffer);
    
    return `/images/trips/${tripId}/current.png`;
  }

  // Save composite as a candidate (not directly as current)
  async saveCompositeCandidate(tripId, imageBuffer) {
    const dir = path.join(this.basePath, 'trips', tripId, 'composites');
    await this.ensureDirectory(dir);
    
    const filename = `composite_${Date.now()}.png`;
    const filePath = path.join(dir, filename);
    
    await fs.writeFile(filePath, imageBuffer);
    
    return `/images/trips/${tripId}/composites/${filename}`;
  }

  // Save regenerated composite with unique filename
  async saveRegeneratedComposite(tripId, imageBuffer, suffix = '') {
    const dir = path.join(this.basePath, 'trips', tripId, 'composites');
    await this.ensureDirectory(dir);
    
    const filename = suffix ? `composite_${suffix}.png` : `composite_${Date.now()}.png`;
    const filePath = path.join(dir, filename);
    
    await fs.writeFile(filePath, imageBuffer);
    
    return `/images/trips/${tripId}/composites/${filename}`;
  }

  // Confirm a composite as the new current background
  async confirmComposite(tripId, compositePath) {
    const dir = path.join(this.basePath, 'trips', tripId);
    const currentPath = path.join(dir, 'current.png');
    
    // Save current to history first
    const timestamp = Date.now();
    const historyDir = path.join(dir, 'history');
    await this.ensureDirectory(historyDir);
    
    try {
      const currentBuffer = await fs.readFile(currentPath);
      await fs.writeFile(path.join(historyDir, `${timestamp}.png`), currentBuffer);
    } catch (error) {
      // No current file yet
    }
    
    // Copy composite to current
    const compositeFullPath = await this.getFullPath(compositePath);
    const compositeBuffer = await fs.readFile(compositeFullPath);
    await fs.writeFile(currentPath, compositeBuffer);
    
    return `/images/trips/${tripId}/current.png`;
  }

  async getFullPath(relativePath) {
    // Convert URL path to file system path
    const cleanPath = relativePath.replace(/^\/images\//, '');
    return path.join(this.basePath, cleanPath);
  }

  async fileExists(relativePath) {
    try {
      const fullPath = await this.getFullPath(relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  // Create a placeholder background for testing
  async createPlaceholderBackground() {
    // Create a simple gradient background using Sharp
    const width = 1024;
    const height = 1024;
    
    // Create a light blue to white gradient
    const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#E3F2FD;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#BBDEFB;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#gradient)" />
        <rect x="100" y="100" width="${width-200}" height="${height-200}" 
              fill="#F5F5F5" rx="50" opacity="0.5" />
      </svg>
    `;
    
    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    return buffer;
  }

  // Delete a file
  async deleteFile(relativePath) {
    try {
      const fullPath = path.join(this.imagesDir, relativePath);
      await fs.unlink(fullPath);
      console.log(`🗑️ Deleted file: ${relativePath}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Save finalized background
  async saveFinalizedBackground(tripId, imageBuffer) {
    const dir = path.join(this.basePath, 'trips', tripId);
    await this.ensureDirectory(dir);
    
    const finalizedPath = path.join(dir, 'finalized.png');
    
    // Save finalized version
    await fs.writeFile(finalizedPath, imageBuffer);
    
    // Also update current to be the finalized version
    const currentPath = path.join(dir, 'current.png');
    await fs.writeFile(currentPath, imageBuffer);
    
    return `/images/trips/${tripId}/finalized.png`;
  }

  // Read image file and return buffer
  async readImage(imagePath) {
    try {
      const buffer = await fs.readFile(imagePath);
      return buffer;
    } catch (error) {
      console.error('Error reading image:', error);
      throw new Error('Failed to read image file');
    }
  }
}

module.exports = new StorageService();