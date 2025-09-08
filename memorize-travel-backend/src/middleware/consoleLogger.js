const logBuffer = [];
const maxLogs = 100;

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args) {
  const logEntry = {
    type: 'log',
    message: args.join(' '),
    timestamp: new Date().toISOString()
  };
  
  logBuffer.push(logEntry);
  if (logBuffer.length > maxLogs) {
    logBuffer.shift();
  }
  
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  const logEntry = {
    type: 'error',
    message: args.join(' '),
    timestamp: new Date().toISOString()
  };
  
  logBuffer.push(logEntry);
  if (logBuffer.length > maxLogs) {
    logBuffer.shift();
  }
  
  originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
  const logEntry = {
    type: 'warn',
    message: args.join(' '),
    timestamp: new Date().toISOString()
  };
  
  logBuffer.push(logEntry);
  if (logBuffer.length > maxLogs) {
    logBuffer.shift();
  }
  
  originalConsoleWarn.apply(console, args);
};

module.exports = {
  getRecentLogs: (count = 50) => {
    return logBuffer.slice(-count);
  },
  clearLogs: () => {
    logBuffer.length = 0;
  }
};