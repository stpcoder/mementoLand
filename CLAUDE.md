# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Memorize Travel" - a web application that transforms travel photos into miniature worlds. Users upload travel photos, which are converted into miniature items and placed onto isometric 3D landscapes representing each trip.

## Tech Stack & Setup

- **Frontend**: React with modern, Toss-inspired UI design (use react-bits MCP server for UI components)
- **API**: Google Gemini 2.5 Flash Image Preview API
- **Model**: `gemini-2.5-flash-image-preview`
- **Image Storage**: Local folder storage required for API re-uploads

## Core Functionality

### 1. Trip Management
- Each trip has its own miniature world with a unique background
- Swipeable navigation between trips (showing edges of adjacent trips)
- New trip creation generates a base landscape via Type 1 API call

### 2. Photo Processing Workflow
1. User uploads photo → Modal opens
2. Type 2 API call → Extracts and creates miniature item
3. "Add to World" button appears
4. Type 3 API call → Composites miniature onto current background
5. New composite becomes the updated background for that trip

### 3. API Call Types

**Type 1 - Background Generation (Text-to-Image)**
```
Isometric 3D render in orthographic projection, 45° bird's-eye view. A single minimalist square land tile, perfectly flat and uniformly covered with smooth sand. Centered composition on a plain solid-color background. Rounded edges and soft bevels; simplified geometry with crisp, clean contours. Matte, smooth surface material.
Lighting and shading: soft global illumination; gentle gradient shading with smooth transitions; subtle ambient occlusion on edges for depth; no harsh shadows, no specular highlights, no texture noise. White snow with a faint cool gray-blue tint; background is a single flat color with mild contrast. High resolution, anti-aliased, no depth of field.
```

**Type 2 - Miniature Extraction (Image-to-Image)**
```
Image-to-image edit. Use the provided image as reference. Extract only the main subjects and rebuild them as a single minimalist 3D asset. Preserve silhouette, pose, proportions.  
Camera: orthographic, slight 3/4 (~35–45°), centered.  
Style: simplified geometry; rounded edges; matte, smooth surfaces with solid albedo color fills.  
Color: keep the subjects' original colors. If unclear, use a limited 2–4 color palette with medium saturation.  
Lighting: soft, even light; gentle gradient shading tinted by each base color; subtle contact shadow; no harsh shadows.  
Background: solid green, flat.  
Output: high resolution, crisp anti-aliased edges; no depth of field or motion blur.  
```

**Type 3 - Composite (Two Images + Prompt)**
```
Composite edit. Use Image B (square land tile) as-is; keep the tile at its original scale and centered position. Do not move, resize, rotate, crop, or zoom the base. Place the figure from Image A somewhere on the tile where it covers as little of the other elements as possible. Keep proportions, but scale it smaller to occupy 10~20% of the tile area. Match Image B camera/perspective and lighting; use the same projection and view angle and rotate/tilt the figure to align with the tile's axes/horizon so vanishing directions match. Minimalist 3D: rounded edges, simplified geometry, matte surface; soft gradient shading only, no harsh shadows or highlights. Add a faint contact shadow under the figure. Do not change the background, colors, framing, or resolution; add nothing else. Make sure the added figure is on the tile.
```

## Development Guidelines

### MVP Focus
- Keep code minimal and focused on core functionality
- No complex error handling for initial version
- Essential logic only - avoid over-engineering

### UI Requirements
- Clean, trendy design inspired by Toss UI
- All text and buttons in English
- Modal for photo upload workflow
- Swipeable trip navigation with partial adjacent trip visibility
- Use react-bits MCP server for component generation

### Image Handling
- Store generated images locally
- Maintain image references for API re-uploads
- Images accumulate on backgrounds (each new miniature adds to existing scene)

### API Integration Pattern
```python
import os
from google import genai
from PIL import Image
from io import BytesIO

response = client.models.generate_content(
    model="gemini-2.5-flash-image-preview",
    contents=prompt,
)
```

## Project Structure Recommendations

```
/src
  /components     # React components
  /api           # Gemini API integration
  /assets        # Static assets
  /images        # Generated/uploaded images storage
  /styles        # CSS/styling
```

## Key Implementation Notes

1. Each trip maintains its own evolving background image
2. Miniatures are progressively added to backgrounds
3. Previous miniatures must remain unchanged when adding new ones
4. Trip switching should show smooth transitions with adjacent trip previews
5. All generated images must be saved locally for reuse in subsequent API calls