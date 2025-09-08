import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import useStore from '../store/useStore';
import { miniatureService } from '../services/api';

const UploadModal = () => {
  const { 
    isModalOpen, 
    closeModal, 
    isProcessing,
    currentUploadedImage,
    generatedMiniature,
    setProcessing,
    setCurrentUploadedImage,
    setGeneratedMiniature,
    getCurrentLand,
    updateLand
  } = useStore();

  const [modalState, setModalState] = useState('upload'); // 'upload', 'processing', 'preview'

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const imageUrl = URL.createObjectURL(file);
    setCurrentUploadedImage(imageUrl);
    
    // Move to processing state
    setModalState('processing');
    setProcessing(true);
    
    try {
      const currentLand = getCurrentLand();
      if (!currentLand) {
        throw new Error('No current land selected');
      }

      // Generate miniature
      const miniatureData = await miniatureService.generateMiniature(file, currentLand.id);
      setGeneratedMiniature(miniatureData);
      setModalState('preview');
    } catch (error) {
      console.error('Error generating miniature:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate miniature';
      alert(`Error: ${errorMessage}\n\nThis may be due to API limitations. Please try again later.`);
      setModalState('upload');
    } finally {
      setProcessing(false);
    }
  }, [setCurrentUploadedImage, setProcessing, setGeneratedMiniature, getCurrentLand]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleAddToWorld = async () => {
    setProcessing(true);
    try {
      const currentLand = getCurrentLand();
      if (!currentLand || !generatedMiniature) {
        throw new Error('Missing land or miniature data');
      }

      // Store current background before adding miniature
      const { setPreviousBackground, setPendingComposite } = useStore.getState();
      setPreviousBackground(currentLand.currentBackground);

      // Add miniature to world - pass the current background to ensure consistency
      const result = await miniatureService.addToWorld(
        currentLand.id, 
        generatedMiniature.miniatureId,
        currentLand.currentBackground
      );
      
      // Store as pending composite (not confirmed yet)
      setPendingComposite({
        image: result.newBackground,
        miniature: generatedMiniature
      });

      // Close modal and reset
      handleClose();
    } catch (error) {
      console.error('Error adding to world:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add miniature to world';
      alert(`Error: ${errorMessage}\n\nThis may be due to API limitations. Please try again later.`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setModalState('upload');
    setCurrentUploadedImage(null);
    setGeneratedMiniature(null);
    closeModal();
  };

  const handleTryAnother = () => {
    setModalState('upload');
    setCurrentUploadedImage(null);
    setGeneratedMiniature(null);
  };

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-modal p-8 max-w-md w-full mx-4 shadow-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {modalState === 'upload' && 'Import Memory'}
              {modalState === 'processing' && 'Creating Memento'}
              {modalState === 'preview' && 'Your Memento'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg 
                className="w-5 h-5 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>

          {/* Upload State */}
          {modalState === 'upload' && (
            <div>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-card p-12 text-center cursor-pointer
                  transition-all duration-300
                  ${isDragActive 
                    ? 'border-primary bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-soft">
                  <svg 
                    className={`w-10 h-10 ${isDragActive ? 'text-primary' : 'text-gray-400'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                </div>
                <p className="text-text-primary font-medium mb-2">
                  {isDragActive ? 'Drop your photo here' : 'Drag & drop your photo'}
                </p>
                <p className="text-text-secondary text-sm">
                  or click to browse (JPG, PNG)
                </p>
              </div>
              
              <button
                disabled
                className="w-full mt-6 btn-primary opacity-50 cursor-not-allowed"
              >
                Generate Memento
              </button>
            </div>
          )}

          {/* Processing State */}
          {modalState === 'processing' && (
            <div className="text-center py-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-gray-200"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                />
              </div>
              <p className="text-lg font-medium text-text-primary mb-2">
                Creating your memento...
              </p>
              <p className="text-sm text-text-secondary">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Preview State */}
          {modalState === 'preview' && generatedMiniature && (
            <div>
              <div className="bg-gray-50 rounded-card p-8 mb-6">
                <img 
                  src={`http://localhost:3000${generatedMiniature.miniatureImage}`} 
                  alt="Generated miniature"
                  className="w-full h-64 object-contain"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleTryAnother}
                  className="flex-1 btn-secondary"
                >
                  Try Again
                </button>
                <button
                  onClick={handleAddToWorld}
                  disabled={isProcessing}
                  className={`flex-1 btn-primary ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Bring to Land'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadModal;