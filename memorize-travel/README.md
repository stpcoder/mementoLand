# Memorize Travel - Frontend

A React-based web application that transforms travel photos into interactive miniature worlds.

## Features Implemented

### 1. **Toss-Inspired Design System**
- Clean, minimalist interface with rounded corners and soft shadows
- Smooth spring animations using Framer Motion
- Vibrant primary blue (#0064FF) with gentle gray accents
- Inter font for modern typography

### 2. **Trip Management**
- Create multiple trips with unique miniature worlds
- Each trip maintains its own background and miniature collection
- Trip counter in header showing current position

### 3. **Swipeable Navigation**
- Smooth horizontal swipe gestures to navigate between trips
- Adjacent trip previews visible on edges (semi-transparent)
- Dot indicators at bottom showing trip position
- Elastic bounce effect at list boundaries

### 4. **Upload Modal with Three States**
- **Upload State**: Drag-and-drop zone with visual feedback
- **Processing State**: Animated loading spinner with preview
- **Preview State**: Generated miniature display with action buttons

### 5. **Floating Upload Button**
- Camera icon floating action button
- Appears only when trips exist
- Smooth scale animation on hover/tap
- Tooltip on hover

### 6. **State Management**
- Zustand store for global state
- Tracks trips, current index, modal state, and processing status
- Persistent miniature accumulation per trip

### 7. **API Integration Points**
- Service layer prepared for backend integration
- Three API endpoints configured:
  - Trip creation with background generation
  - Miniature generation from photos
  - Composite creation (miniature + background)

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool for fast development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Dropzone** - File upload handling
- **Zustand** - State management
- **Axios** - API communication

## Project Structure

```
src/
├── components/
│   ├── Header.jsx         # App header with trip counter
│   ├── TripView.jsx       # Main trip display with swipe
│   ├── UploadModal.jsx    # Three-state upload modal
│   └── UploadButton.jsx   # Floating action button
├── services/
│   └── api.js             # API service layer
├── store/
│   └── useStore.js        # Zustand state management
├── index.css              # Tailwind styles
└── App.jsx                # Main app component
```

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Application runs on http://localhost:5173
```

## Design Highlights

### Color Palette
- **Primary**: #0064FF (Vibrant blue)
- **Secondary**: #6B7684 (Soft gray)
- **Success**: #00C896 (Green)
- **Background**: #F5F7FA (Light neutral)
- **Surface**: #FFFFFF (Pure white)

### Component Styling
- **Border Radius**: 12-16px for buttons, 16px for cards, 20px for modals
- **Shadows**: Multi-layered soft shadows for depth
- **Animations**: 300-400ms spring animations
- **Spacing**: Generous 16-24px padding

### Responsive Design
- Mobile-first approach
- Touch-optimized swipe gestures
- Flexible layout adapting to screen size

## MVP Status

✅ **Completed Features**:
- Full UI implementation with Toss-inspired design
- Trip creation and navigation
- Upload modal with three distinct states
- Swipeable trip navigation with previews
- State management system
- API service layer structure

⏳ **Pending Backend Integration**:
- Actual Gemini API calls for image generation
- Image persistence to local filesystem
- Trip data persistence

## Next Steps

1. Implement backend server (Express + Gemini API)
2. Connect frontend to backend endpoints
3. Add image storage and retrieval
4. Test complete photo-to-miniature workflow
