import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { landService } from '../services/api';

const CreateLandButton = () => {
  const { addLand } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [landName, setLandName] = useState('');

  const handleCreateLand = async () => {
    setIsCreating(true);
    try {
      const result = await landService.createLand(landName || `Trip ${new Date().toLocaleDateString()}`);
      
      // Transform to frontend format
      const newLand = {
        id: result.landId,
        name: result.name,
        backgroundImage: result.backgroundImage,
        currentBackground: result.currentBackground,
        miniatures: [],
        createdAt: result.createdAt
      };
      
      addLand(newLand);
      setLandName('');
      setShowNameInput(false);
    } catch (error) {
      console.error('Error creating land:', error);
      alert('Failed to create new land. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNameInput(true)}
        disabled={isCreating}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-button hover:from-blue-600 hover:to-purple-700 transition-all group disabled:opacity-50"
        style={{
          boxShadow: '0 4px 20px rgba(100, 50, 255, 0.35)'
        }}
      >
        {isCreating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
          />
        ) : (
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        )}
        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Create New Land
        </span>
      </motion.button>

      {/* Name Input Modal */}
      <AnimatePresence>
        {showNameInput && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !isCreating && setShowNameInput(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-modal p-6 max-w-sm w-full shadow-large"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Create New Land
              </h3>
              <input
                type="text"
                value={landName}
                onChange={(e) => setLandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleCreateLand();
                  }
                }}
                placeholder="Enter land name (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                disabled={isCreating}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNameInput(false)}
                  disabled={isCreating}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLand}
                  disabled={isCreating}
                  className="flex-1 btn-primary flex items-center justify-center"
                >
                  {isCreating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateLandButton;