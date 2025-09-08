# Backend Product Requirements Document (PRD)
## Memorize Travel - API Service Layer

### 1. Service Overview

**Service Name:** Memorize Travel Backend  
**Version:** 1.0 MVP  
**Architecture:** Node.js Express API Server  
**Primary Function:** Interface between React frontend and Google Gemini API for image generation and processing

### 2. System Architecture

#### 2.1 Technology Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **API Client:** Google Generative AI SDK
- **File Handling:** Multer (file uploads), Sharp (image processing)
- **Storage:** Local filesystem
- **Environment:** Development (local), Production (TBD)

#### 2.2 Architecture Diagram
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   React FE  │────▶│ Express API  │────▶│  Gemini API     │
└─────────────┘     └──────────────┘     └─────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Local Storage│
                    │   (Images)   │
                    └──────────────┘
```

### 3. API Endpoints Specification

#### 3.1 Trip Management

##### POST /api/trips/create
**Purpose:** Create a new trip with generated background  
**Request:**
```json
{
  "tripName": "string (optional)"
}
```
**Process:**
1. Generate unique trip ID
2. Call Gemini API (Type 1 - Background Generation)
3. Save generated image locally
4. Return trip metadata

**Response:**
```json
{
  "tripId": "trip_123456",
  "backgroundImage": "/images/trips/trip_123456/background.png",
  "createdAt": "2024-01-07T10:00:00Z"
}
```

##### GET /api/trips
**Purpose:** Retrieve all trips  
**Response:**
```json
{
  "trips": [
    {
      "tripId": "trip_123456",
      "currentBackground": "/images/trips/trip_123456/current.png",
      "miniatureCount": 3,
      "createdAt": "2024-01-07T10:00:00Z"
    }
  ]
}
```

#### 3.2 Miniature Generation

##### POST /api/miniatures/generate
**Purpose:** Convert uploaded photo to miniature  
**Request:** Multipart form data
```
- file: Image file (JPEG/PNG)
- tripId: Associated trip ID
```

**Process:**
1. Save uploaded image temporarily
2. Call Gemini API (Type 2 - Miniature Extraction)
3. Save generated miniature
4. Return miniature data

**Response:**
```json
{
  "miniatureId": "mini_789012",
  "miniatureImage": "/images/miniatures/mini_789012.png",
  "originalImage": "/images/originals/photo_789012.jpg"
}
```

##### POST /api/miniatures/add-to-world
**Purpose:** Composite miniature onto trip background  
**Request:**
```json
{
  "tripId": "trip_123456",
  "miniatureId": "mini_789012"
}
```

**Process:**
1. Load current trip background
2. Load miniature image
3. Call Gemini API (Type 3 - Composite)
4. Save new composite as current background
5. Update trip metadata

**Response:**
```json
{
  "success": true,
  "newBackground": "/images/trips/trip_123456/current.png",
  "miniatureCount": 4
}
```

### 4. Gemini API Integration

#### 4.1 Configuration
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY // Set in .env file
});

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-image-preview" 
});
```

#### 4.2 API Call Types

##### Type 1: Background Generation
```javascript
async function generateBackground() {
  const prompt = `Isometric 3D render in orthographic projection, 45° bird's-eye view. A single minimalist square land tile, perfectly flat and uniformly covered with smooth sand. Centered composition on a plain solid-color background. Rounded edges and soft bevels; simplified geometry with crisp, clean contours. Matte, smooth surface material.
  Lighting and shading: soft global illumination; gentle gradient shading with smooth transitions; subtle ambient occlusion on edges for depth; no harsh shadows, no specular highlights, no texture noise. White snow with a faint cool gray-blue tint; background is a single flat color with mild contrast. High resolution, anti-aliased, no depth of field.`;
  
  const result = await model.generateContent(prompt);
  return result; // Process and save image
}
```

##### Type 2: Miniature Extraction
```javascript
async function extractMiniature(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const image = {
    inlineData: {
      data: imageData.toString('base64'),
      mimeType: 'image/jpeg'
    }
  };
  
  const prompt = `Image-to-image edit. Use the provided image as reference. Extract only the main subjects and rebuild them as a single minimalist 3D asset. Preserve silhouette, pose, proportions.  
  Camera: orthographic, slight 3/4 (~35–45°), centered.  
  Style: simplified geometry; rounded edges; matte, smooth surfaces with solid albedo color fills.  
  Color: keep the subjects' original colors. If unclear, use a limited 2–4 color palette with medium saturation.  
  Lighting: soft, even light; gentle gradient shading tinted by each base color; subtle contact shadow; no harsh shadows.  
  Background: solid green, flat.  
  Output: high resolution, crisp anti-aliased edges; no depth of field or motion blur.`;
  
  const result = await model.generateContent([prompt, image]);
  return result;
}
```

##### Type 3: Composite Images
```javascript
async function compositeImages(miniaturePath, backgroundPath) {
  const miniatureData = fs.readFileSync(miniaturePath);
  const backgroundData = fs.readFileSync(backgroundPath);
  
  const images = [
    {
      inlineData: {
        data: miniatureData.toString('base64'),
        mimeType: 'image/png'
      }
    },
    {
      inlineData: {
        data: backgroundData.toString('base64'),
        mimeType: 'image/png'
      }
    }
  ];
  
  const prompt = `Composite edit. Use Image B (square land tile) as-is; keep the tile at its original scale and centered position. Do not move, resize, rotate, crop, or zoom the base. Place the figure from Image A somewhere on the tile where it covers as little of the other elements as possible. Keep proportions, but scale it smaller to occupy 10~20% of the tile area. Match Image B camera/perspective and lighting; use the same projection and view angle and rotate/tilt the figure to align with the tile's axes/horizon so vanishing directions match. Minimalist 3D: rounded edges, simplified geometry, matte surface; soft gradient shading only, no harsh shadows or highlights. Add a faint contact shadow under the figure. Do not change the background, colors, framing, or resolution; add nothing else. Make sure the added figure is on the tile.`;
  
  const result = await model.generateContent([prompt, ...images]);
  return result;
}
```

### 5. File Storage System

#### 5.1 Directory Structure
```
/public/images/
├── trips/
│   ├── trip_123456/
│   │   ├── background.png      # Original generated background
│   │   ├── current.png         # Latest composite with all miniatures
│   │   └── history/            # Previous versions (optional)
│   └── trip_789012/
│       ├── background.png
│       └── current.png
├── miniatures/
│   ├── mini_123456.png        # Generated miniature items
│   └── mini_789012.png
└── originals/
    ├── photo_123456.jpg        # User uploaded photos
    └── photo_789012.jpg
```

#### 5.2 File Management
```javascript
const storage = {
  saveTripBackground: async (tripId, imageBuffer) => {
    const dir = `./public/images/trips/${tripId}`;
    await fs.mkdir(dir, { recursive: true });
    const path = `${dir}/background.png`;
    await fs.writeFile(path, imageBuffer);
    await fs.copyFile(path, `${dir}/current.png`); // Initial current
    return `/images/trips/${tripId}/background.png`;
  },
  
  saveMiniature: async (miniatureId, imageBuffer) => {
    const path = `./public/images/miniatures/${miniatureId}.png`;
    await fs.writeFile(path, imageBuffer);
    return `/images/miniatures/${miniatureId}.png`;
  },
  
  updateTripBackground: async (tripId, imageBuffer) => {
    const path = `./public/images/trips/${tripId}/current.png`;
    await fs.writeFile(path, imageBuffer);
    return `/images/trips/${tripId}/current.png`;
  }
};
```

### 6. Data Models

#### 6.1 In-Memory Data Store (MVP)
```javascript
// Simple in-memory store for MVP
const dataStore = {
  trips: new Map(),
  miniatures: new Map()
};

// Trip Model
class Trip {
  constructor(id) {
    this.id = id;
    this.backgroundImage = null;
    this.currentBackground = null;
    this.miniatures = [];
    this.createdAt = new Date();
  }
}

// Miniature Model
class Miniature {
  constructor(id, tripId) {
    this.id = id;
    this.tripId = tripId;
    this.originalImage = null;
    this.miniatureImage = null;
    this.addedAt = new Date();
  }
}
```

### 7. Error Handling (Simplified for MVP)

#### 7.1 Basic Error Responses
```javascript
// API Error Response Format
{
  "error": true,
  "message": "User-friendly error message"
}

// Common Error Cases
- Invalid file format → "Please upload a JPEG or PNG image"
- API timeout → "Processing taking longer than expected, please try again"
- File too large → "Image must be under 10MB"
- Trip not found → "Trip not found, please refresh and try again"
```

### 8. Environment Configuration

#### 8.1 Environment Variables
```env
# .env file
PORT=3001
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.5-flash-image-preview
IMAGE_STORAGE_PATH=./public/images
MAX_FILE_SIZE=10485760  # 10MB
```

### 9. API Performance Requirements

#### 9.1 Response Time Targets
- **Background Generation:** < 5 seconds
- **Miniature Generation:** < 4 seconds
- **Composite Creation:** < 4 seconds
- **File Upload:** < 2 seconds
- **Metadata Queries:** < 100ms

#### 9.2 Concurrent Request Handling
- Support minimum 10 concurrent users
- Queue system for Gemini API calls (rate limiting)
- Implement request timeout (30 seconds)

### 10. Security Considerations (MVP)

#### 10.1 Basic Security Measures
- File type validation (JPEG/PNG only)
- File size limits (10MB max)
- Sanitize file names
- CORS configuration for frontend domain
- Rate limiting (10 requests per minute per IP)

### 11. Development Roadmap

#### Phase 1: Setup (4 hours)
- [ ] Initialize Express server
- [ ] Configure Google Generative AI SDK
- [ ] Set up file storage system
- [ ] Create basic folder structure

#### Phase 2: Core APIs (8 hours)
- [ ] Implement trip creation endpoint
- [ ] Implement miniature generation endpoint
- [ ] Implement composite creation endpoint
- [ ] Add file upload handling

#### Phase 3: Integration (4 hours)
- [ ] Test Gemini API integration
- [ ] Implement image processing pipeline
- [ ] Add CORS and static file serving
- [ ] Create simple data persistence

#### Phase 4: Testing (2 hours)
- [ ] Test complete flow with frontend
- [ ] Verify image storage and retrieval
- [ ] Basic performance testing
- [ ] Simple error case handling

### 12. MVP Limitations

#### Included in MVP
- Single server instance
- Local file storage
- In-memory data store
- Basic error messages
- Simple sequential processing

#### Excluded from MVP
- Database integration
- User authentication
- Image optimization/compression
- Batch processing
- Webhook/async processing
- CDN integration
- Backup/recovery
- Monitoring/logging
- Advanced error handling

### 13. Sample Implementation

#### 13.1 Server Bootstrap
```javascript
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-image-preview" 
});

// Routes
app.post('/api/trips/create', createTrip);
app.post('/api/miniatures/generate', upload.single('file'), generateMiniature);
app.post('/api/miniatures/add-to-world', addToWorld);

app.listen(3001, () => {
  console.log('Memorize Travel API running on port 3001');
});
```

### 14. Testing Checklist

- [ ] Can create new trip with background
- [ ] Can upload and process photo
- [ ] Can generate miniature from photo
- [ ] Can composite miniature to background
- [ ] Images persist in file system
- [ ] Frontend can retrieve all images
- [ ] API responds within time targets
- [ ] Basic error cases handled gracefully