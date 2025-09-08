# Memorize Travel 🌍✈️

Transform your travel memories into miniature worlds! Upload your travel photos and watch them transform into beautiful isometric 3D miniature items placed in your own virtual travel worlds.

## 🎯 Project Overview

**Memorize Travel** is an innovative web application that converts travel photos into miniature collectibles within isometric 3D worlds. Each trip becomes its own unique miniature landscape where your photo memories are transformed into 3D miniature items.

### Key Features
- 📸 **Photo-to-Miniature Conversion**: Extract key subjects from travel photos and transform them into 3D miniature items
- 🏝️ **Trip-Based Worlds**: Each trip has its own unique isometric landscape
- 🎨 **Progressive World Building**: Add miniatures one by one to build your travel world
- 📱 **Swipeable Navigation**: Easily navigate between different trip worlds
- 🤖 **AI-Powered Generation**: Using Google Gemini 2.5 Flash Image Preview API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with pip
- Google Gemini API Key (provided in `.env.example`)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/stpcoder/mementoLand.git
cd mementoLand
```

2. **Python Dependencies Setup (for OpenCV)**
```bash
# Install Python dependencies for image processing
pip install opencv-python numpy pillow

# On macOS, you might need:
brew install opencv

# On Ubuntu/Debian:
# sudo apt-get install python3-opencv
```

3. **Backend Setup**
```bash
cd memorize-travel-backend
npm install
```

4. **Frontend Setup**
```bash
cd ../memorize-travel
npm install
```

5. **Environment Configuration**
Create `.env` file in the backend directory:
```bash
cd memorize-travel-backend
cp .env.example .env
```

Edit `.env` file:
```env
# Google Gemini API Configuration
GEMINI_API_KEY=...
MODEL_NAME=gemini-2.5-flash-image-preview

# VEO API Configuration
VEO_API_KEY=...

# Server Configuration
PORT=3000

# File Storage
IMAGE_STORAGE_PATH=./public/images
MAX_FILE_SIZE=1048576000
```

### Running the Application

1. **Start Backend Server**
```bash
cd memorize-travel-backend
npm start
# Server runs on http://localhost:3000
```

2. **Start Frontend Development Server**
```bash
cd memorize-travel
npm run dev
# Frontend runs on http://localhost:5173
```

3. **Access the Application**
Open your browser and navigate to `http://localhost:5173`

## 💡 How It Works

### 1. Create a New Trip
- Click "New Trip" button to generate a unique isometric landscape
- Each trip gets its own miniature world with a distinctive background

### 2. Upload Travel Photos
- Click the upload button to open the photo modal
- Select a photo from your travel memories
- The AI extracts the main subject and converts it to a 3D miniature

### 3. Build Your World
- Click "Add to World" to place the miniature in your trip landscape
- Continue adding photos to progressively build your miniature world
- Each new miniature is intelligently placed without disturbing existing items

### 4. Navigate Between Trips
- Swipe left/right to navigate between different trip worlds
- See previews of adjacent trips on the edges for smooth navigation
- Each trip maintains its own collection of miniatures

## 🏗️ Architecture

### Frontend (React + Vite + Tailwind)
```
memorize-travel/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── hooks/           # Custom React hooks
│   ├── store/           # State management
│   └── styles/          # Global styles
```

### Backend (Node.js + Express)
```
memorize-travel-backend/
├── src/
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   └── utils/           # Utility functions
├── uploads/             # User uploaded images
└── generated/           # AI generated images
```

## 🔧 API Integration

The application uses Google Gemini 2.5 Flash Image Preview API for AI-powered image generation:

### API Endpoints

#### Backend API Routes
- `POST /api/trips` - Create a new trip with generated background
- `GET /api/trips` - Get all trips
- `POST /api/trips/:id/photos` - Upload photo to a trip
- `POST /api/generate/miniature` - Generate miniature from photo
- `POST /api/generate/composite` - Add miniature to world

#### Gemini API Integration Types

**Type 1: Background Generation (Text-to-Image)**
- Generates isometric 3D landscape for new trips
- Creates minimalist square land tiles with soft shading

**Type 2: Miniature Extraction (Image-to-Image)**
- Extracts main subjects from uploaded photos
- Converts to simplified 3D miniature assets
- Preserves original colors and proportions

**Type 3: Composite Generation (Multi-Image)**
- Combines miniature with existing background
- Intelligently places items without overlap
- Maintains consistent perspective and lighting

## 🎨 Design Philosophy

- **Minimalist Aesthetic**: Clean, modern interface inspired by Toss UI
- **Isometric 3D Style**: Consistent 45° bird's-eye view across all elements
- **Progressive Enhancement**: Worlds grow organically with each addition
- **Intuitive Navigation**: Swipeable interface with visual previews

## 📁 Project Structure

```
mementoLand/
├── memorize-travel/              # React frontend application
├── memorize-travel-backend/      # Node.js backend server
├── README.md                     # This file
├── PRD_Frontend.md              # Frontend requirements
├── PRD_Backend.md               # Backend requirements
└── E2E_TEST_REPORT.md          # End-to-end testing documentation
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Framer Motion** - Animation library
- **React Query** - Data fetching and caching

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Multer** - File upload handling
- **Sharp** - Image processing
- **Google Generative AI SDK** - Gemini API integration
- **Cors** - Cross-origin resource sharing
- **Python/OpenCV** - Advanced image segmentation and processing

## 🚦 Development Workflow

1. **Backend First**: Start the backend server to handle API requests
2. **Frontend Dev**: Run frontend in development mode with hot reload
3. **Image Storage**: All images are stored locally for reuse in API calls
4. **Progressive Building**: Each miniature addition creates a new composite

## 📝 Environment Variables

### Backend (.env)
```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.5-flash-image-preview

# VEO API Configuration (Optional)
VEO_API_KEY=your_veo_api_key_here

# Server Configuration
PORT=3000

# File Storage
IMAGE_STORAGE_PATH=./public/images
MAX_FILE_SIZE=1048576000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Issues**
   - Ensure the Gemini API key is correctly set in `.env`
   - Check API quota and rate limits

2. **Port Conflicts**
   - Backend defaults to port 3000
   - Frontend defaults to port 5173
   - Change in respective config files if needed

3. **Image Upload Errors**
   - Ensure `public/images/` directory exists in backend
   - Check file permissions for write access

4. **CORS Errors**
   - Backend CORS is configured for localhost:5173
   - Update CORS settings for different frontend ports

5. **Python/OpenCV Issues**
   - If `cv2` import fails, ensure OpenCV is properly installed:
     ```bash
     python3 -c "import cv2; print(cv2.__version__)"
     ```
   - On macOS with M1/M2, you might need to use conda:
     ```bash
     conda install -c conda-forge opencv
     ```
   - Verify numpy is installed: `pip install numpy`

## 📄 License

This project is created for the Google Gemini 2.5 Hackathon.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📧 Contact

For questions or support, please open an issue in the GitHub repository.

---

Built with ❤️ using Google Gemini 2.5 Flash Image Preview API