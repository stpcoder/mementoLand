import React from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

const UploadButton = () => {
  const { lands, openModal, pendingComposite } = useStore();

  // Don't show button if no lands exist
  if (lands.length === 0) return null;

  // Check if button should be disabled
  const isDisabled = !!pendingComposite;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={!isDisabled ? openModal : undefined}
      className={`fixed bottom-8 right-8 z-30 text-white p-4 rounded-full shadow-button transition-all group ${
        isDisabled 
          ? 'bg-gray-400 cursor-not-allowed opacity-50' 
          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer'
      }`}
      style={{
        boxShadow: isDisabled 
          ? '0 2px 10px rgba(0, 0, 0, 0.1)' 
          : '0 4px 20px rgba(100, 50, 255, 0.35)'
      }}
      disabled={isDisabled}
    >
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
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
        />
      </svg>
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Upload Photo
      </span>
    </motion.button>
  );
};

export default UploadButton;