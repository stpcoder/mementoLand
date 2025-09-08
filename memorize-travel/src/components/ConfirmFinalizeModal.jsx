import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmFinalizeModal = ({ isOpen, onClose, onConfirm, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({});
  
  const steps = [
    { id: 1, text: 'Extracting keywords from image...' },
    { id: 2, text: 'Generating background music...' },
    { id: 3, text: 'Enhancing background scenery...' }
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setStepStatus({});
    }
  }, [isLoading]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setCurrentStep(1);
    
    try {
      // Start all steps as processing
      setStepStatus({ 1: 'processing' });
      
      // Call the actual finalization API
      const result = await onConfirm();
      
      // If successful, show all steps as completed
      if (result) {
        for (let i = 1; i <= steps.length; i++) {
          setStepStatus(prev => ({ ...prev, [i]: 'completed' }));
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Wait a bit before closing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete(result);
        }
      }
    } catch (error) {
      console.error('Finalization failed:', error);
      // You can add error handling UI here
    } finally {
      setIsLoading(false);
      // Don't close the modal here - let parent component handle it
    }
  };

  const getStepIcon = (stepId) => {
    const status = stepStatus[stepId];
    
    if (status === 'completed') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      );
    }
    
    if (status === 'processing') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      );
    }
    
    return (
      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={!isLoading ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-card max-w-md w-full shadow-large"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {isLoading ? 'Finalizing Your Land' : 'Finalize Land?'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {isLoading ? 'Please wait while we complete the process' : 'Complete your memento land'}
                </p>
              </div>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isLoading ? (
              <>
                <ul className="text-sm text-text-secondary space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Once finalized, you cannot add more mementos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>The land will be permanently locked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>You can still export and share the finalized land</span>
                  </li>
                </ul>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-button font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    className="flex-1 btn-primary"
                  >
                    Yes, Finalize
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                {/* Progress Steps */}
                <div className="space-y-4 mb-6">
                  {steps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (step.id - 1) * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      {getStepIcon(step.id)}
                      <span 
                        className={`text-sm ${
                          stepStatus[step.id] === 'completed' 
                            ? 'text-green-600 font-medium' 
                            : stepStatus[step.id] === 'processing'
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: `${(Object.keys(stepStatus).filter(key => stepStatus[key] === 'completed').length / steps.length) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Loading Message */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    This may take a few moments. Please don't close this window.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmFinalizeModal;