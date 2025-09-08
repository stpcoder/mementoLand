require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize console logger before anything else
const consoleLogger = require('./middleware/consoleLogger');

// Import routes
const tripRoutes = require('./routes/trips');
const miniatureRoutes = require('./routes/miniatures');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Routes
app.use('/api/trips', tripRoutes);
app.use('/api/miniatures', miniatureRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Snap Land API is running' });
});

// Logs endpoint
app.get('/api/logs', (req, res) => {
  const count = parseInt(req.query.count) || 50;
  const logs = consoleLogger.getRecentLogs(count);
  res.json({ logs });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: true, 
    message: err.message || 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`Snap Land API running on port ${PORT}`);
  console.log(`Images served at http://localhost:${PORT}/images/`);
});