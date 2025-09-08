import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { miniatureService } from '../services/api';
import NewLandModal from './NewLandModal';
import FinalizeModal from './FinalizeModal';
import ConfirmFinalizeModal from './ConfirmFinalizeModal';

const LandView = () => {
  const { 
    lands, 
    currentLandIndex, 
    setCurrentLandIndex,
    pendingComposite,
    previousBackground,
    setPendingComposite,
    setPreviousBackground,
    updateLand,
    clearPendingState,
    setProcessing,
    setLandSegments,
    getLandSegments
  } = useStore();
  const [dragX, setDragX] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [displayedImages, setDisplayedImages] = useState([]); // Array of displayed original images
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null); // Track selected segment
  const [swipeDirection, setSwipeDirection] = useState(0); // -1 for left, 1 for right
  const [isNewLandModalOpen, setIsNewLandModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [finalizeResult, setFinalizeResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  // Get current land
  const currentLand = lands[currentLandIndex];
  const prevLand = currentLandIndex > 0 ? lands[currentLandIndex - 1] : null;
  const nextLand = currentLandIndex < lands.length - 1 ? lands[currentLandIndex + 1] : null;
  
  // Clear displayed images and selection when land changes
  useEffect(() => {
    setDisplayedImages([]);
    setSelectedSegment(null);
  }, [currentLandIndex]);

  // Handle background music playback
  useEffect(() => {
    console.log('🎵 Music useEffect triggered');
    console.log('Current land:', currentLand);
    console.log('Background music URL:', currentLand?.backgroundMusic);
    console.log('Current audio ref:', audioRef.current);
    
    // Stop previous audio if it exists
    if (audioRef.current) {
      console.log('🛑 Stopping previous audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
    
    // Play new audio if land has background music
    if (currentLand?.backgroundMusic) {
      console.log('🎼 Attempting to play music:', currentLand.backgroundMusic);
      const audioUrl = `http://localhost:3000${currentLand.backgroundMusic}`;
      console.log('Full audio URL:', audioUrl);
      
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0.5; // Set to 50% volume
      
      // Store reference
      audioRef.current = audio;
      
      // Play audio
      audio.play().then(() => {
        console.log('✅ Audio playback started successfully');
        setIsPlaying(true);
      }).catch(error => {
        console.error('❌ Audio playback failed:', error);
        console.error('Error details:', error.message, error.name);
        setIsPlaying(false);
      });
    } else {
      console.log('⚠️ No background music for current land');
    }

    // Cleanup function to stop audio when component unmounts
    return () => {
      if (audioRef.current) {
        console.log('🧹 Cleanup: stopping audio');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [currentLandIndex, currentLand?.backgroundMusic]);

  // Toggle music play/pause
  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing music:', error);
        setIsPlaying(false);
      });
    }
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100;
    
    if (info.offset.x > swipeThreshold && currentLandIndex > 0) {
      setSwipeDirection(1); // Swiping right to go to previous
      setCurrentLandIndex(currentLandIndex - 1);
    } else if (info.offset.x < -swipeThreshold && currentLandIndex < lands.length - 1) {
      setSwipeDirection(-1); // Swiping left to go to next
      setCurrentLandIndex(currentLandIndex + 1);
    }
    setDragX(0);
  };

  // Get segments for current land
  const { segments = [], originalImages = {} } = currentLand ? getLandSegments(currentLand.id) : {};

  // Handle confirming the pending composite
  const handleConfirm = async () => {
    if (pendingComposite && currentLand) {
      setIsConfirming(true);
      try {
        // Call backend to confirm the composite, passing the previous background for CV2 segmentation
        const result = await miniatureService.confirmComposite(
          currentLand.id,
          pendingComposite.image,
          pendingComposite.miniature,
          previousBackground // Pass the background before the miniature was added
        );
        
        // Store segmentation data if available
        if (result.segments && result.segments.length > 0) {
          // Store segments for this land
          setLandSegments(currentLand.id, result.segments, result.originalImages);
          setShowBoundingBoxes(true);
          console.log('Segmentation found', result.segments.length, 'objects');
          console.log('Original images mapping:', result.originalImages);
        }
        
        // Update local state with confirmed background
        updateLand(currentLand.id, {
          currentBackground: result.currentBackground,
          miniatures: [...(currentLand.miniatures || []), pendingComposite.miniature]
        });
        clearPendingState();
      } catch (error) {
        console.error('Error confirming composite:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to confirm composite';
        alert(`Error: ${errorMessage}\n\nPlease try again.`);
      } finally {
        setIsConfirming(false);
      }
    }
  };

  // Handle regenerating the composite
  const handleFinalize = async () => {
    if (!currentLand) return;
    
    // Don't close the modal here - let the modal handle it
    // setIsConfirmModalOpen(false);
    
    try {
      console.log('Starting finalization for trip:', currentLand.id);
      
      // Call the actual finalization API
      const response = await fetch(`http://localhost:3000/api/trips/${currentLand.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Finalization response:', data);
      
      if (data.success) {
        const result = {
          finalImage: data.finalizedBackground,
          landId: currentLand.id,
          landName: currentLand.name,
          miniatureCount: currentLand.miniatures?.length || 0,
          startDate: currentLand.startDate,
          endDate: currentLand.endDate,
          createdAt: new Date().toISOString(),
          backgroundMusic: data.backgroundMusic
        };
        
        setFinalizeResult(result);
        
        // Update land to mark as finalized and update the background
        updateLand(currentLand.id, { 
          isFinalized: true,
          currentBackground: data.finalizedBackground,
          backgroundMusic: data.backgroundMusic
        });
        
        // Play background music if available
        if (data.backgroundMusic) {
          // Stop any current audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          
          const audio = new Audio(`http://localhost:3000${data.backgroundMusic}`);
          audio.loop = true;
          audio.volume = 0.5;
          audio.play().catch(err => console.error('Error playing music:', err));
          audioRef.current = audio; // Save the audio instance
        }
        
        // Open the export modal after finalization
        setIsFinalizeModalOpen(true);
        
        return result; // Return result for modal to use
      } else {
        console.error('Error finalizing land:', data.message);
      }
    } catch (error) {
      console.error('Error finalizing land:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!pendingComposite || !previousBackground || !currentLand) return;
    
    setIsRegenerating(true);
    try {
      // Call regenerate API with the previous background and miniature
      const result = await miniatureService.regenerateComposite(
        currentLand.id,
        pendingComposite.miniature.miniatureId,
        previousBackground // Pass the previous background (before miniature was added)
      );
      
      // Update pending composite with new result
      setPendingComposite({
        image: result.newBackground,
        miniature: pendingComposite.miniature
      });
    } catch (error) {
      console.error('Error regenerating composite:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to regenerate composite';
      alert(`Error: ${errorMessage}\n\nThis may be due to API limitations. Please try again later.`);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (lands.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg 
              className="w-16 h-16 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 2l2.4 7.4h7.6l-6 4.6 2.4 7.4L12 16.8 5.6 21.4 8 14l-6-4.6h7.6L12 2z" 
              />
            </svg>
          </div>
          <p className="text-text-secondary mb-6">
            Create a new land to begin building your memento land
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNewLandModalOpen(true)}
            className="btn-primary px-8 py-3 text-lg font-semibold"
          >
            Start Your Journey
          </motion.button>
        </div>
        
        {/* New Land Modal */}
        <NewLandModal 
          isOpen={isNewLandModalOpen} 
          onClose={() => setIsNewLandModalOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-background">
      {/* Previous Land Preview */}
      <AnimatePresence>
        {prevLand && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-0 top-0 bottom-0 w-64 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(245,247,250,0.6) 0%, rgba(245,247,250,0.2) 70%, transparent 100%)'
            }}
          >
            {prevLand.currentBackground && (
              <motion.img 
                key={prevLand.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={`http://localhost:3000${prevLand.currentBackground}`} 
                alt="Previous land"
                className="w-96 h-96 object-cover rounded-3xl shadow-xl"
                style={{ 
                  position: 'absolute',
                  left: '-120px',
                  top: '30%',
                  transform: 'none',
                  filter: 'blur(0.5px)',
                  opacity: 0.5
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Land Preview OR New Land Button */}
      <AnimatePresence>
        {nextLand ? (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute right-0 top-0 bottom-0 w-64 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(-90deg, rgba(245,247,250,0.6) 0%, rgba(245,247,250,0.2) 70%, transparent 100%)'
            }}
          >
            {nextLand.currentBackground && (
              <motion.img 
                key={nextLand.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={`http://localhost:3000${nextLand.currentBackground}`} 
                alt="Next land"
                className="w-96 h-96 object-cover rounded-3xl shadow-xl"
                style={{ 
                  position: 'absolute',
                  right: '-120px',
                  top: '30%',
                  transform: 'none',
                  filter: 'blur(0.5px)',
                  opacity: 0.5
                }}
              />
            )}
          </motion.div>
        ) : currentLandIndex === lands.length - 1 && lands.length > 0 && (
          // Show New Land button when on last land
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute right-24 z-20"
            style={{ top: '45%', transform: 'translateY(-50%)' }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNewLandModalOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-full shadow-button hover:from-indigo-600 hover:to-purple-700 transition-all group"
              style={{
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                width: '64px',
                height: '64px'
              }}
            >
              <svg 
                className="w-8 h-8 transition-all duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              
              {/* Tooltip on hover */}
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                New Land
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Land */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLandIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDrag={(event, info) => setDragX(info.offset.x)}
          onDragEnd={handleDragEnd}
          initial={{ 
            x: swipeDirection === 1 ? window.innerWidth : swipeDirection === -1 ? -window.innerWidth : 0,
            opacity: 0
          }}
          animate={{ 
            x: dragX,
            opacity: 1,
            transition: {
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }
          }}
          exit={{ 
            x: swipeDirection === -1 ? window.innerWidth : swipeDirection === 1 ? -window.innerWidth : 0,
            opacity: 0,
            transition: {
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }
          }}
          className="flex-1 flex flex-col items-center justify-center p-8 cursor-grab active:cursor-grabbing"
        >
          {/* Land Title and Date */}
          {currentLand && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {currentLand.name || `Land ${currentLandIndex + 1}`}
              </h2>
              <p className="text-sm text-text-secondary">
                {currentLand.startDate && currentLand.endDate ? (
                  <>
                    {new Date(currentLand.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    {' - '}
                    {new Date(currentLand.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </>
                ) : currentLand.createdAt ? (
                  new Date(currentLand.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                ) : (
                  'Just created'
                )}
              </p>
            </div>
          )}

          {currentLand?.currentBackground || pendingComposite ? (
            <div className="relative w-full max-w-2xl aspect-square">
              <img 
                key={pendingComposite ? pendingComposite.image : currentLand.currentBackground}
                src={pendingComposite 
                  ? `http://localhost:3000${pendingComposite.image}?t=${Date.now()}`
                  : `http://localhost:3000${currentLand.currentBackground}?t=${Date.now()}`
                } 
                alt="Land miniature world"
                className="w-full h-full object-contain rounded-card shadow-large"
                draggable={false}
              />
              
              {/* Upload Photo Button - positioned at bottom-right of image */}
              {!pendingComposite && !currentLand?.isFinalized && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => useStore.getState().openModal()}
                  className="absolute bottom-4 right-4 z-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-button hover:from-blue-600 hover:to-purple-700 transition-all group"
                  style={{
                    boxShadow: '0 4px 20px rgba(100, 50, 255, 0.35)'
                  }}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Import Memory
                  </span>
                </motion.button>
              )}
              
              {/* Music Control Button - Show only if land has background music */}
              {currentLand?.backgroundMusic && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMusic}
                  className="absolute bottom-4 right-4 z-20 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 rounded-full shadow-button hover:from-purple-600 hover:to-pink-700 transition-all"
                  style={{
                    boxShadow: '0 4px 20px rgba(150, 50, 200, 0.35)'
                  }}
                >
                  {isPlaying ? (
                    // Pause Icon
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  ) : (
                    // Play Icon
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  )}
                </motion.button>
              )}
              
              {/* Finalize Button - shows at top-right when land has miniatures and not finalized */}
              {!pendingComposite && !currentLand?.isFinalized && currentLand?.miniatures?.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="absolute top-4 right-4 z-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-button hover:from-blue-600 hover:to-purple-700 transition-all group"
                  style={{
                    boxShadow: '0 4px 20px rgba(100, 50, 255, 0.35)'
                  }}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 3L10 14M21 3l-7 20-4-9-9-4 20-7z" 
                    />
                  </svg>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Finalize
                  </span>
                </motion.button>
              )}
              
              {/* Finalized Badge - Clickable to reopen export modal */}
              {currentLand?.isFinalized && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Set the result and open the finalize modal
                    setFinalizeResult({
                      finalImage: currentLand.currentBackground,
                      landId: currentLand.id,
                      landName: currentLand.name,
                      miniatureCount: currentLand.miniatures?.length || 0,
                      startDate: currentLand.startDate,
                      endDate: currentLand.endDate,
                      createdAt: currentLand.createdAt
                    });
                    setIsFinalizeModalOpen(true);
                  }}
                  className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-soft hover:from-blue-600 hover:to-purple-700 transition-colors cursor-pointer group"
                  style={{
                    boxShadow: '0 2px 10px rgba(100, 50, 255, 0.25)'
                  }}
                >
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Export
                  </span>
                </motion.button>
              )}
              
              {/* Bounding Box Overlay */}
              {segments.length > 0 && (
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1024 1024"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ zIndex: 10 }}
                >
                  {segments.map((segment) => (
                    <g key={segment.id}>
                      <rect
                        x={segment.bbox.x}
                        y={segment.bbox.y}
                        width={segment.bbox.width}
                        height={segment.bbox.height}
                        fill={
                          showBoundingBoxes && hoveredSegment === segment.id 
                            ? "rgba(255, 0, 0, 0.2)" 
                            : "transparent"
                        }
                        stroke={
                          showBoundingBoxes 
                            ? (hoveredSegment === segment.id ? "#ff0000" : "#ff6666")
                            : "transparent"
                        }
                        strokeWidth={hoveredSegment === segment.id ? "3" : "2"}
                        strokeDasharray={showBoundingBoxes ? "5,5" : "0"}
                        opacity={showBoundingBoxes ? 1 : 0}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          pointerEvents: 'all'
                        }}
                        onMouseEnter={() => {
                          console.log('Hovering segment:', segment.id);
                          setHoveredSegment(segment.id);
                          
                          // Show image popup on hover when boxes are hidden
                          if (!showBoundingBoxes) {
                            const segmentOriginalImage = originalImages[segment.id];
                            if (segmentOriginalImage) {
                              const imageData = {
                                id: segment.id,
                                path: segmentOriginalImage,
                                label: segment.label,
                                isHoverPopup: true // Mark as hover popup
                              };
                              // Add to displayed images if not already there
                              if (!displayedImages.find(img => img.id === segment.id)) {
                                setDisplayedImages(prev => [...prev, imageData]);
                              }
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          console.log('Left segment:', segment.id);
                          setHoveredSegment(null);
                          
                          // Remove hover popup when mouse leaves
                          if (!showBoundingBoxes) {
                            setDisplayedImages(prev => prev.filter(img => !img.isHoverPopup || img.id !== segment.id));
                          }
                        }}
                        onClick={() => {
                          // Toggle selection
                          if (selectedSegment === segment.id) {
                            setSelectedSegment(null);
                            // Remove the persistent image when deselecting
                            setDisplayedImages(prev => prev.filter(img => img.id !== segment.id));
                          } else {
                            setSelectedSegment(segment.id);
                            
                            const segmentOriginalImage = originalImages[segment.id];
                            console.log('Selected segment:', segment.id, 'Original image:', segmentOriginalImage);
                            if (segmentOriginalImage) {
                              const imageData = {
                                id: segment.id,
                                path: segmentOriginalImage,
                                label: segment.label,
                                isPersistent: true, // Mark as persistent (clicked, not hover)
                                isSelected: true // Mark as selected item
                              };
                              
                              // Remove hover popup version if exists and add persistent version
                              setDisplayedImages(prev => {
                                const filtered = prev.filter(img => img.id !== segment.id);
                                const newImages = [...filtered, imageData];
                                // Keep only last 5 persistent images + any hover popups
                                const persistent = newImages.filter(img => img.isPersistent);
                                const hover = newImages.filter(img => img.isHoverPopup);
                                return [...persistent.slice(-5), ...hover];
                              });
                            } else {
                              console.log('No original image available for segment', segment.id);
                            }
                          }
                        }}
                      />
                      {showBoundingBoxes && (
                        <text
                          x={segment.bbox.x}
                          y={segment.bbox.y - 5}
                          fill={hoveredSegment === segment.id ? "#ff0000" : "#ff6666"}
                          fontSize={hoveredSegment === segment.id ? "16" : "14"}
                          fontWeight="bold"
                          style={{ 
                            pointerEvents: 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {segment.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              )}
              
              {/* Removed duplicate button - now only at line 445 */}
              
              {/* Pending composite controls */}
              {pendingComposite && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className={`px-4 py-2 bg-green-500 text-white rounded-button font-medium shadow-soft transition-colors ${
                      isConfirming ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                    }`}
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={`px-4 py-2 bg-orange-500 text-white rounded-button font-medium shadow-soft transition-colors ${
                      isRegenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
                    }`}
                  >
                    {isRegenerating ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Regenerating...</span>
                      </div>
                    ) : (
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                        />
                      </svg>
                    )}
                  </motion.button>
                </div>
              )}
              
              {/* Pending indicator */}
              {pendingComposite && (
                <div className="absolute top-4 left-4 bg-yellow-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-soft">
                  <p className="text-xs font-medium text-white">
                    Preview - Not saved yet
                  </p>
                </div>
              )}
              
              {/* Show Boxes button - always show when segments exist and no pending composite */}
              {segments.length > 0 && !pendingComposite && (
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-sm font-medium rounded-button shadow-soft hover:bg-white transition-colors"
                  style={{ zIndex: 30 }}
                >
                  {showBoundingBoxes ? 'Hide' : 'Show'} Boxes ({segments.length})
                </button>
              )}
              
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-soft">
                <p className="text-xs font-medium text-text-primary">
                  {currentLand.miniatures?.length || 0} memories
                  {pendingComposite && ' (+1 pending)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl aspect-square bg-white rounded-card shadow-soft flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
                <p className="text-text-secondary">
                  Generating world...
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Swipe Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {lands.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              const direction = index < currentLandIndex ? 1 : -1;
              setSwipeDirection(direction);
              setCurrentLandIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentLandIndex 
                ? 'w-8 bg-primary' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
      
      {/* Original Images Speech Bubbles */}
      {displayedImages.map((image, index) => {
        // Calculate position for each image
        const isLeftSide = index < 3;  // Changed: 3 images on left
        const isRightSide = index >= 3;
        
        // Position calculation - closer to screen edges, further from center
        // Main land image is max-w-2xl (672px) centered, so space on each side is (100vw - 672px) / 2
        // Position popups closer to edges (1/6 from edge instead of 1/4)
        let positionStyles = {};
        if (isLeftSide) {
          // Left side: positioned closer to the left edge
          positionStyles = {
            left: 'calc((100vw - min(672px, 90vw)) / 8)',  // Closer to edge (1/8 of space from edge)
            top: `${8 + index * 14}rem` // 8rem base + 14rem spacing (tighter)
          };
        } else {
          // Right side: positioned closer to the right edge
          const rightIndex = index - 3;  // Changed: offset by 3 for right side
          positionStyles = {
            right: 'calc((100vw - min(672px, 90vw)) / 8)',  // Closer to edge (1/8 of space from edge)
            top: `${8 + rightIndex * 20}rem` // 8rem base + 20rem spacing (same as before)
          };
        }
        
        return (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute z-50"
            style={{ ...positionStyles, maxWidth: '280px' }}
          >
            <div className="relative">
              {/* Main Bubble Container */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Close button only for persistent (clicked) images, not hover popups */}
                {image.isPersistent && (
                  <button
                    onClick={() => {
                      setDisplayedImages(prev => prev.filter(img => img.id !== image.id));
                      setHoveredSegment(null);
                      // Clear selection if this was the selected item
                      if (selectedSegment === image.id) {
                        setSelectedSegment(null);
                      }
                    }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all hover:scale-110"
                  >
                    <svg 
                      className="w-4 h-4 text-gray-700" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                )}
                
                {/* Image Container */}
                <div className="p-3 bg-gradient-to-b from-white to-gray-50">
                  <img 
                    src={`http://localhost:3000${image.path}`}
                    alt={image.label || "Original uploaded"}
                    className="w-full rounded-lg shadow-inner"
                    style={{ maxHeight: '260px', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {/* New Land Modal */}
      <NewLandModal 
        isOpen={isNewLandModalOpen} 
        onClose={() => setIsNewLandModalOpen(false)} 
      />
      
      {/* Confirmation Modal */}
      <ConfirmFinalizeModal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleFinalize}
        onComplete={(result) => {
          // Close the modal and open the finalize result modal
          setIsConfirmModalOpen(false);
          if (result) {
            setIsFinalizeModalOpen(true);
          }
        }}
      />
      
      {/* Finalize Modal */}
      <FinalizeModal 
        isOpen={isFinalizeModalOpen} 
        onClose={() => setIsFinalizeModalOpen(false)}
        result={finalizeResult}
      />
    </div>
  );
};

export default LandView;