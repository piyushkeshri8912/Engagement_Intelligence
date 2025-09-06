const express = require('express');
const router = express.Router();
const engagementTracker = require('../services/engagementTracker');
const logger = require('../utils/logger');

// POST /api/engagement/session/start
router.post('/session/start', async (req, res) => {
  try {
    const { userId, courseId, metadata } = req.body;
    
    if (!userId || !courseId) {
      return res.status(400).json({ 
        error: 'userId and courseId are required' 
      });
    }

    const sessionId = await engagementTracker.startSession(userId, courseId, metadata);
    
    res.json({
      success: true,
      sessionId,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/engagement/session/end
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'sessionId is required' 
      });
    }

    await engagementTracker.endSession(sessionId);
    
    res.json({
      success: true,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// POST /api/engagement/activity
router.post('/activity', async (req, res) => {
  try {
    const { sessionId, type, activityId, metadata } = req.body;
    
    if (!sessionId || !type) {
      return res.status(400).json({ 
        error: 'sessionId and type are required' 
      });
    }

    const sessionData = await engagementTracker.updateActivity(sessionId, {
      type,
      activityId,
      metadata,
      timestamp: Date.now()
    });
    
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      engagementScore: sessionData.engagementScore,
      interactions: sessionData.interactions,
      timeSpent: sessionData.timeSpent
    });
  } catch (error) {
    logger.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// GET /api/engagement/session/:sessionId
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionData = await engagementTracker.getSession(sessionId);
    
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: sessionData
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// GET /api/engagement/user/:userId/stats
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '7d' } = req.query;
    
    const stats = await engagementTracker.getUserEngagementStats(userId, timeframe);
    
    res.json({
      success: true,
      stats,
      timeframe
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

module.exports = router;
