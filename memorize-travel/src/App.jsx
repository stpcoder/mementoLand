import React, { useEffect } from 'react';
import LandView from './components/LandView';
import UploadModal from './components/UploadModal';
import DebugLogs from './components/DebugLogs';
import useStore from './store/useStore';
import { landService } from './services/api';

function App() {
  const { lands, setLands, addLand, setLandSegments } = useStore();

  // Load lands on mount and persist them
  useEffect(() => {
    loadLands();
  }, []);

  const loadLands = async () => {
    try {
      const data = await landService.getAllLands();
      if (data.lands && data.lands.length > 0) {
        // Transform backend data to frontend format
        const transformedLands = await Promise.all(data.lands.map(async (land) => {
          // Fetch detailed info for each land to get miniatures and segments
          try {
            const detailedLand = await landService.getLand(land.tripId);
            
            // Store segments in the store if they exist
            if (detailedLand.segments && detailedLand.segments.length > 0) {
              setLandSegments(land.tripId, detailedLand.segments, detailedLand.segmentMapping);
              console.log(`Loaded ${detailedLand.segments.length} segments for land ${land.tripId}`);
            }
            
            return {
              id: land.tripId,
              name: land.name,
              currentBackground: land.currentBackground,
              miniatures: detailedLand.miniatures || [],
              backgroundMusic: detailedLand.backgroundMusic || land.backgroundMusic || null,
              isFinalized: detailedLand.isFinalized || land.isFinalized || false,
              createdAt: land.createdAt,
              startDate: land.startDate,
              endDate: land.endDate
            };
          } catch (error) {
            console.error(`Failed to load details for land ${land.tripId}:`, error);
            return {
              id: land.tripId,
              name: land.name,
              currentBackground: land.currentBackground,
              miniatures: [],
              backgroundMusic: land.backgroundMusic || null,
              isFinalized: land.isFinalized || false,
              createdAt: land.createdAt,
              startDate: land.startDate,
              endDate: land.endDate
            };
          }
        }));
        setLands(transformedLands);
      }
    } catch (error) {
      console.error('Failed to load lands:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col">
        <LandView />
      </main>
      <UploadModal />
      <DebugLogs />
    </div>
  );
}

export default App
