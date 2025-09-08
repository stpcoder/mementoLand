import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DebugLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/logs?count=30');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen]);

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      default: return 'text-gray-300';
    }
  };

  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-mono opacity-50 hover:opacity-100 transition-opacity"
      >
        🐛 Debug
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-0 top-0 h-full w-96 bg-gray-900 text-white shadow-2xl z-40 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
              <h3 className="font-mono text-sm">Backend Logs</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-2 py-1 rounded text-xs ${
                    autoRefresh ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  {autoRefresh ? '🔄 Auto' : '⏸ Manual'}
                </button>
                <button
                  onClick={fetchLogs}
                  className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Logs Container */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs available</div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${getLogColor(log.type)} break-all whitespace-pre-wrap`}
                  >
                    <span className="text-gray-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{' '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DebugLogs;