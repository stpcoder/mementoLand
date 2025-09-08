# Frontend Product Requirements Document (PRD)
## Memorize Travel - Web Application

### 1. Product Overview

**Product Name:** Memorize Travel  
**Version:** 1.0 MVP  
**Platform:** Web (React + Vite + Tailwind CSS)  
**Purpose:** Transform travel photos into interactive miniature worlds where each trip becomes a unique isometric landscape populated with miniaturized memories.

### 2. User Interface Requirements

#### 2.1 Main Screen Layout
- **Full-screen viewport** displaying current trip's miniature world
- **Swipeable horizontal navigation** between trips
  - Adjacent trips partially visible (10-15% of screen width)
  - Semi-transparent overlay on adjacent trip previews (opacity: 0.3-0.4)
  - Smooth transition animations between trips
- **Fixed action buttons** overlay on main view

#### 2.2 Core UI Components

##### Header Section
- **App Title:** "Memorize Travel" (centered, elegant typography)
- **Trip Indicator:** Current trip number/name (e.g., "Trip 3 of 5")

##### Action Buttons
- **Add New Trip Button**
  - Position: Top-right corner
  - Icon: Plus symbol
  - Action: Creates new trip with generated background
  
- **Upload Photo Button**  
  - Position: Bottom-center (floating action button style)
  - Icon: Camera/Upload icon
  - Prominent design (primary color, shadow effect)

##### Trip Navigation
- **Swipe Gestures:**
  - Left swipe: Navigate to next trip
  - Right swipe: Navigate to previous trip
- **Visual Feedback:**
  - Elastic/bounce effect at list boundaries
  - Smooth parallax scrolling for adjacent trip previews

#### 2.3 Upload Modal

##### Modal Structure
```
┌─────────────────────────────┐
│       Upload Photo          │
│                             │
│  ┌───────────────────┐      │
│  │                   │      │
│  │   Drop Zone/      │      │
│  │   File Selector   │      │
│  │                   │      │
│  └───────────────────┘      │
│                             │
│  [Generate Miniature]       │
│                             │
│  ─────────────────────      │
│                             │
│  Preview Area               │
│  (Shows generated miniature)│
│                             │
│  [Add to World]             │
└─────────────────────────────┘
```

##### Modal States
1. **Initial State**
   - Drop zone for image upload
   - "Generate Miniature" button (disabled until image selected)

2. **Processing State**
   - Loading spinner
   - "Creating your miniature..." text
   - Progress indicator (if possible)

3. **Preview State**
   - Display generated miniature
   - "Add to World" button (primary action)
   - "Try Another Photo" button (secondary action)

### 3. Visual Design Specifications

#### 3.1 Design System (Toss-inspired)
- **Typography:**
  - Primary Font: Clean sans-serif (e.g., Inter, Pretendard)
  - Hierarchy: Clear size/weight differentiation
  - Minimal text, icon-first approach

- **Color Palette:**
  - Background: Light neutral (#F5F7FA)
  - Primary Action: Vibrant blue (#0064FF)
  - Secondary: Soft gray (#6B7684)
  - Success: Green (#00C896)
  - Surface: Pure white (#FFFFFF)

- **Component Style:**
  - Border Radius: 12-16px (rounded corners)
  - Shadows: Subtle, multi-layered (0 2px 8px rgba(0,0,0,0.08))
  - Spacing: Generous padding (16-24px)
  - Animations: Smooth, spring-based (300-400ms)

#### 3.2 Responsive Behavior
- **Mobile-first approach** (primary target)
- **Breakpoints:**
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px  
  - Desktop: 1024px+

### 4. State Management

#### 4.1 Application State Structure
```javascript
{
  trips: [
    {
      id: string,
      name: string,
      backgroundImage: string, // Local file path
      miniatures: [
        {
          id: string,
          originalPhoto: string,
          miniatureImage: string,
          addedAt: timestamp
        }
      ],
      currentBackground: string // Latest composite image
    }
  ],
  currentTripIndex: number,
  ui: {
    isModalOpen: boolean,
    isProcessing: boolean,
    uploadProgress: number
  }
}
```

#### 4.2 Data Persistence
- **Local Storage:** Trip metadata and image references
- **File System:** Actual images stored in `/public/images/` or similar
- **State Recovery:** Restore last viewed trip on app reload

### 5. User Flows

#### 5.1 Create New Trip Flow
1. User clicks "Add New Trip" button
2. System generates background via API (Type 1)
3. New trip added to trip list
4. View automatically switches to new trip
5. Empty miniature world displayed

#### 5.2 Add Miniature Flow
1. User clicks "Upload Photo" button
2. Modal opens with upload interface
3. User selects/drops image file
4. Click "Generate Miniature" → API call (Type 2)
5. Preview generated miniature in modal
6. Click "Add to World" → API call (Type 3)
7. Modal closes, updated world displayed
8. New composite becomes trip's current background

#### 5.3 Navigate Trips Flow
1. User swipes left/right on main view
2. Smooth transition to adjacent trip
3. Trip indicator updates
4. Adjacent trip previews update

### 6. Technical Implementation

#### 6.1 React Component Structure
```
App
├── Header
│   ├── AppTitle
│   └── TripIndicator
├── TripView
│   ├── TripCanvas (displays background + miniatures)
│   ├── SwipeHandler
│   └── AdjacentTripPreviews
├── ActionButtons
│   ├── AddTripButton
│   └── UploadPhotoButton
└── UploadModal
    ├── FileUploader
    ├── ProcessingView
    └── PreviewView
```

#### 6.2 Key Libraries
- **React** (^18.x) - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Dropzone** - File upload
- **Swiper.js** or custom - Swipe gestures

#### 6.3 API Integration Points
- **Image Upload:** FormData with local file
- **API Response Handling:** Convert base64/blob to local file
- **Error States:** Simple user-friendly messages
- **Loading States:** Skeleton screens, spinners

### 7. Performance Considerations

#### 7.1 Image Optimization
- **Lazy Loading:** Load only visible trip images
- **Compression:** Optimize images before storage
- **Caching:** Browser cache for static assets
- **Preview Generation:** Low-res placeholders while loading

#### 7.2 Animation Performance
- **GPU Acceleration:** Use transform/opacity for animations
- **Will-change:** Optimize critical animations
- **RequestAnimationFrame:** Smooth gesture handling

### 8. MVP Scope Limitations

#### What's Included
- Basic trip creation and navigation
- Single photo upload at a time
- Simple miniature generation and placement
- Local image storage
- Core swipe navigation

#### What's Excluded (Future Versions)
- User authentication
- Cloud storage
- Social sharing
- Trip naming/editing
- Miniature repositioning
- Multiple photo batch upload
- Undo/redo functionality
- Complex error handling
- Analytics/tracking

### 9. Success Metrics

#### MVP Success Criteria
- [ ] Users can create multiple trips
- [ ] Photos successfully convert to miniatures
- [ ] Miniatures accumulate on backgrounds
- [ ] Smooth navigation between trips
- [ ] All images persist locally
- [ ] Clean, Toss-inspired UI
- [ ] Sub-3 second API response times

### 10. Development Checklist

#### Phase 1: Setup (Day 1)
- [ ] Initialize React + Vite + Tailwind project
- [ ] Set up component structure
- [ ] Configure image storage system

#### Phase 2: Core UI (Day 2)
- [ ] Implement main trip view
- [ ] Add swipe navigation
- [ ] Create upload modal
- [ ] Style with Tailwind (Toss-inspired)

#### Phase 3: Integration (Day 3)
- [ ] Connect to Gemini API
- [ ] Implement image processing flows
- [ ] Add state management
- [ ] Test complete user flows

#### Phase 4: Polish (Day 4)
- [ ] Add animations and transitions
- [ ] Optimize performance
- [ ] Final UI adjustments
- [ ] Basic testing