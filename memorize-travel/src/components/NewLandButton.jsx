import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NewLandModal from './NewLandModal';

const NewLandButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 right-8 z-30 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-button hover:from-blue-600 hover:to-purple-700 transition-all group"
        style={{
          boxShadow: '0 4px 20px rgba(100, 50, 255, 0.35)'
        }}
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
            d="M12 4v16m8-8H4" 
          />
        </svg>
        <span className="absolute -bottom-10 right-14 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Create Memento Land
        </span>
      </motion.button>
      
      <NewLandModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default NewLandButton;