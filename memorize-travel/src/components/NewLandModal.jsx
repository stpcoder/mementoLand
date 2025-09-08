import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { landService } from '../services/api';
import useStore from '../store/useStore';

const NewLandModal = ({ isOpen, onClose }) => {
  const [landName, setLandName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [backgroundType, setBackgroundType] = useState('grass');
  const [isCreating, setIsCreating] = useState(false);
  const { addLand } = useStore();

  const handleCreate = async () => {
    if (!landName || !startDate || !endDate) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const landData = await landService.createLand(landName, startDate, endDate, backgroundType);
      
      // Add period information to the land
      const newLand = {
        ...landData,
        id: landData.landId,
        name: landName,
        startDate,
        endDate,
        backgroundImage: landData.backgroundImage || landData.currentBackground,
        currentBackground: landData.currentBackground || landData.backgroundImage,
        miniatures: [],
        createdAt: landData.createdAt || new Date().toISOString()
      };
      
      addLand(newLand);
      
      // Reset form
      setLandName('');
      setStartDate('');
      setEndDate('');
      onClose();
    } catch (error) {
      console.error('Failed to create land:', error);
      alert('Failed to create land. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
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
              Create Memento Land
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isCreating}
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Land Name
              </label>
              <input
                type="text"
                value={landName}
                onChange={(e) => setLandName(e.target.value)}
                placeholder="e.g., Tokyo Adventure"
                className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-3 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Background Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setBackgroundType('grass')}
                  className={`px-4 py-3 rounded-button font-medium transition-all ${
                    backgroundType === 'grass' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isCreating}
                >
                  🌿 Grass
                </motion.button>
                <div
                  className="px-4 py-3 rounded-button font-medium bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  title="Coming soon"
                >
                  🏖️ Sand
                </div>
                <div
                  className="px-4 py-3 rounded-button font-medium bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  title="Coming soon"
                >
                  ❄️ Snow
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating || !landName || !startDate || !endDate}
              className={`w-full btn-primary ${isCreating || !landName || !startDate || !endDate ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Creating Land...</span>
                </div>
              ) : (
                'Create Land'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewLandModal;