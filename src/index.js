const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const engagementRoutes = require('./routes/engagement');
const analyticsRoutes = require('./routes/analytics');
const nudgeRoutes = require('./routes/nudges');
const dashboardRoutes = require('./routes/dashboard');
const { initializeWebSockets } = require('./websockets/socketHandler');
const realTimeDataService = require('./services/realTimeDataService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Serve the main dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Routes
app.use('/api/engagement', engagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/nudges', nudgeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Engagement & Retention Intelligence Layer'
  });
});

// Initialize WebSocket handlers
initializeWebSockets(io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Engagement & Retention Intelligence Layer started successfully');
  logger.info('Real-time data service initialized and running');
});

module.exports = app;
