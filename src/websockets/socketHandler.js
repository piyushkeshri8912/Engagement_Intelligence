const logger = require('../utils/logger');
const engagementTracker = require('../services/engagementTracker');
const nudgeService = require('../services/nudgeService');
const datasetService = require('../services/datasetService');
const realTimeDataService = require('../services/realTimeDataService');

let io = null;

const initializeWebSockets = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    logger.info('User connected', { socketId: socket.id });

    // Handle user authentication and room joining
    socket.on('authenticate', async (data) => {
      try {
        const { userId, courseId, token } = data;
        
        // TODO: Validate token and authenticate user
        
        // Join user-specific room for targeted notifications
        socket.join(`user_${userId}`);
        
        // Join course-specific room if provided
        if (courseId) {
          socket.join(`course_${courseId}`);
        }

        // Store user info in socket
        socket.userId = userId;
        socket.courseId = courseId;

        socket.emit('authenticated', { 
          status: 'success', 
          userId,
          message: 'Connected to engagement tracking' 
        });

        logger.info('User authenticated', { userId, socketId: socket.id });
      } catch (error) {
        logger.error('Authentication error:', error);
        socket.emit('authenticated', { 
          status: 'error', 
          message: 'Authentication failed' 
        });
      }
    });
    
    // Handle dashboard connection
    socket.on('join_dashboard', () => {
      socket.join('dashboard');
      socket.emit('dashboard_joined', { 
        message: 'Connected to real-time dashboard updates',
        timestamp: Date.now()
      });
      logger.info('Dashboard user connected', { socketId: socket.id });
    });

    // Handle session start
    socket.on('session_start', async (data) => {
      try {
        const { userId, courseId, metadata } = data;
        const sessionId = await engagementTracker.startSession(userId, courseId, metadata);
        
        socket.sessionId = sessionId;
        socket.emit('session_started', { sessionId, timestamp: Date.now() });

        logger.info('Session started via WebSocket', { userId, courseId, sessionId });
      } catch (error) {
        logger.error('Session start error:', error);
        socket.emit('error', { message: 'Failed to start session' });
      }
    });

    // Handle activity tracking
    socket.on('activity', async (data) => {
      try {
        const { sessionId, type, activityId, metadata } = data;
        
        const sessionData = await engagementTracker.updateActivity(sessionId || socket.sessionId, {
          type,
          activityId,
          metadata,
          timestamp: Date.now()
        });

        if (sessionData) {
          // Emit updated engagement score to user
          socket.emit('engagement_update', {
            engagementScore: sessionData.engagementScore,
            interactions: sessionData.interactions,
            timeSpent: sessionData.timeSpent
          });

          // Emit to course room for instructor dashboard
          if (socket.courseId) {
            socket.to(`course_${socket.courseId}`).emit('student_activity', {
              userId: socket.userId,
              engagementScore: sessionData.engagementScore,
              activityType: type
            });
          }
        }
      } catch (error) {
        logger.error('Activity tracking error:', error);
        socket.emit('error', { message: 'Failed to track activity' });
      }
    });

    // Handle nudge interactions
    socket.on('nudge_interaction', async (data) => {
      try {
        const { nudgeId, interactionType } = data;
        await nudgeService.trackNudgeInteraction(nudgeId, interactionType, socket.userId);
        
        socket.emit('nudge_interaction_tracked', { 
          nudgeId, 
          interactionType,
          timestamp: Date.now() 
        });

        logger.info('Nudge interaction tracked', { 
          nudgeId, 
          interactionType, 
          userId: socket.userId 
        });
      } catch (error) {
        logger.error('Nudge interaction tracking error:', error);
      }
    });

    // Handle heartbeat for engagement tracking
    socket.on('heartbeat', async () => {
      if (socket.sessionId) {
        try {
          await engagementTracker.updateActivity(socket.sessionId, {
            type: 'heartbeat',
            timestamp: Date.now()
          });
        } catch (error) {
          logger.error('Heartbeat tracking error:', error);
        }
      }
    });

    // Handle session end
    socket.on('session_end', async () => {
      if (socket.sessionId) {
        try {
          await engagementTracker.endSession(socket.sessionId);
          socket.emit('session_ended', { timestamp: Date.now() });
        } catch (error) {
          logger.error('Session end error:', error);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      logger.info('User disconnected', { 
        socketId: socket.id, 
        userId: socket.userId,
        reason 
      });

      // End session if it exists
      if (socket.sessionId) {
        try {
          await engagementTracker.endSession(socket.sessionId);
        } catch (error) {
          logger.error('Error ending session on disconnect:', error);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Set up periodic engagement analysis
  setInterval(async () => {
    try {
      // Get all connected users in rooms and analyze engagement
      const rooms = io.sockets.adapter.rooms;
      
      for (const [roomName, room] of rooms) {
        if (roomName.startsWith('user_')) {
          const userId = roomName.replace('user_', '');
          // TODO: Implement periodic engagement analysis
          // This could trigger nudges for users who haven't been active
        }
      }
    } catch (error) {
      logger.error('Periodic engagement analysis error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Set up real-time data broadcasting
  realTimeDataService.on('metrics_updated', (metrics) => {
    try {
      const realtimeMetrics = {
        activeNow: metrics.activeUsers,
        activitiesPerMin: 180 + Math.floor(Math.random() * 80),
        engagementRate: metrics.engagementScore,
        dropOffRate: metrics.dropOffRate,
        sessionDuration: metrics.sessionDuration,
        nudgeClickRate: metrics.nudgeClickRate,
        newSignupsToday: metrics.newSignups,
        systemLoad: metrics.systemLoad,
        timestamp: metrics.timestamp,
        company: datasetService.companyName,
        totalUsers: 52340 + metrics.newSignups
      };
      
      logger.info('Broadcasting real-time metrics', { 
        activeUsers: metrics.activeUsers, 
        engagement: metrics.engagementScore,
        connectedClients: io.engine.clientsCount 
      });
      
      io.to('dashboard').emit('metrics_update', realtimeMetrics);
      
      // Broadcast new activity from dataset
      const recentActivities = datasetService.getRealTimeActivity();
      if (recentActivities && recentActivities.length > 0) {
        const latestActivity = recentActivities[0];
        const activity = {
          id: latestActivity.id,
          type: latestActivity.type,
          userName: latestActivity.user?.name || 'Anonymous User',
          details: latestActivity.details,
          timestamp: Date.now()
        };
        
        io.to('dashboard').emit('new_activity', activity);
      }
      
    } catch (error) {
      logger.error('Real-time broadcast error:', error);
    }
  });

  logger.info('WebSocket handlers initialized');
};

const getIO = () => {
  return io;
};

// Broadcast system-wide notifications
const broadcastNotification = (notification) => {
  if (io) {
    io.emit('system_notification', notification);
  }
};

// Send notification to specific user
const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

// Send notification to course participants
const sendToCourse = (courseId, event, data) => {
  if (io) {
    io.to(`course_${courseId}`).emit(event, data);
  }
};

module.exports = {
  initializeWebSockets,
  getIO,
  broadcastNotification,
  sendToUser,
  sendToCourse
};
