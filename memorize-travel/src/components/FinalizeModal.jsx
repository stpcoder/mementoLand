import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FinalizeModal = ({ isOpen, onClose, result }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleDownload = async () => {
    if (!result?.finalImage) return;
    
    setIsDownloading(true);
    try {
      // Create a download link
      const imageUrl = `http://localhost:3000${result.finalImage}`;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.landName || 'land'}_finalized_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/land/${result?.landId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to copy share link');
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-modal p-8 max-w-2xl w-full mx-4 shadow-large"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              Land Finalized
            </h2>
            <button
              onClick={onClose}
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

          {/* Content */}
          <div className="space-y-6">
            {/* Final Image Preview */}
            {result?.finalImage && (
              <div className="mb-6 flex justify-center">
                <img 
                  src={`http://localhost:3000${result.finalImage}`}
                  alt="Finalized land"
                  className="w-full max-w-md h-auto rounded-xl shadow-md"
                />
              </div>
            )}

            {/* Emotional Message */}
            <div className="text-center mb-6">
              <p className="text-xl font-semibold text-text-primary mb-2">
                {result?.landName || 'Your Journey'}
                {result?.startDate && result?.endDate && (
                  <span className="text-sm font-normal text-text-secondary">
                    {', '}
                    {new Date(result.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' ~ '}
                    {new Date(result.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </p>
              <p className="text-base text-text-secondary">
                {result?.mementoCount || result?.miniatureCount || 0} memories are saved forever
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex-1 btn-primary ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isDownloading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                        />
                      </svg>
                      Download Image
                    </>
                  )}
                </div>
              </button>

              <button
                onClick={handleShare}
                disabled={isSharing}
                className={`flex-1 btn-secondary ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isSharing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Copying...</span>
                    </>
                  ) : (
                    <>
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
                          d="M13 10V3L4 14h7v7l9-11h-7z" 
                        />
                      </svg>
                      Share Link
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FinalizeModal;