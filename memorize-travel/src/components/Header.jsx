import React from 'react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100"
    >
      <div className="px-6 py-2">
        {/* Empty header for now - can add other elements if needed */}
      </div>
    </motion.header>
  );
};

export default Header;