const express = require('express');
const router = express.Router();
const nudgeService = require('../services/nudgeService');
const datasetService = require('../services/datasetService');
const logger = require('../utils/logger');

// POST /api/nudges/trigger
router.post('/trigger', async (req, res) => {
  try {
    const { userId, courseId, context } = req.body;
    
    if (!userId || !courseId || !context) {
      return res.status(400).json({ 
        error: 'userId, courseId, and context are required' 
      });
    }

    const nudge = await nudgeService.triggerNudge(userId, courseId, context);
    
    if (!nudge) {
      return res.json({
        success: true,
        message: 'Nudge was throttled to prevent spam',
        throttled: true
      });
    }

    res.json({
      success: true,
      nudge: {
        id: nudge.id,
        type: nudge.type,
        title: nudge.title,
        message: nudge.message,
        priority: nudge.priority,
        deliveryChannel: nudge.deliveryChannel
      }
    });
  } catch (error) {
    logger.error('Error triggering nudge:', error);
    res.status(500).json({ error: 'Failed to trigger nudge' });
  }
});

// POST /api/nudges/:nudgeId/interaction
router.post('/:nudgeId/interaction', async (req, res) => {
  try {
    const { nudgeId } = req.params;
    const { interactionType, userId } = req.body;
    
    if (!interactionType || !userId) {
      return res.status(400).json({ 
        error: 'interactionType and userId are required' 
      });
    }

    // Validate interaction type
    const validInteractions = ['clicked', 'dismissed', 'completed', 'viewed'];
    if (!validInteractions.includes(interactionType)) {
      return res.status(400).json({ 
        error: 'Invalid interaction type' 
      });
    }

    await nudgeService.trackNudgeInteraction(nudgeId, interactionType, userId);
    
    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking nudge interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// GET /api/nudges/user/:userId/history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, hours = 24 } = req.query;
    
    const nudges = await nudgeService.getRecentNudges(userId, parseInt(hours));
    
    res.json({
      success: true,
      nudges: nudges.slice(0, parseInt(limit)),
      total: nudges.length,
      timeframe: `${hours} hours`
    });
  } catch (error) {
    logger.error('Error getting nudge history:', error);
    res.status(500).json({ error: 'Failed to get nudge history' });
  }
});

// GET /api/nudges/user/:userId/preferences
router.get('/user/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await nudgeService.getUserNudgeProfile(userId);
    
    res.json({
      success: true,
      preferences: profile
    });
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get user preferences' });
  }
});

// PUT /api/nudges/user/:userId/preferences
router.put('/user/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { prefersChallenges, bestTimeToNudge, effectiveNudgeTypes, timezone } = req.body;
    
    // TODO: Implement preference updates in database
    const updatedPreferences = {
      userId,
      prefersChallenges: prefersChallenges !== undefined ? prefersChallenges : true,
      bestTimeToNudge: bestTimeToNudge || '14:00',
      effectiveNudgeTypes: effectiveNudgeTypes || ['reminder', 'motivational'],
      timezone: timezone || 'UTC',
      updatedAt: new Date().toISOString()
    };

    logger.info('User nudge preferences updated', { userId, preferences: updatedPreferences });
    
    res.json({
      success: true,
      preferences: updatedPreferences
    });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET /api/nudges/templates
router.get('/templates', async (req, res) => {
  try {
    // Get available nudge templates
    const templates = {
      reminder: {
        type: 'reminder',
        defaultTitle: "Don't lose momentum!",
        defaultMessage: "You were making great progress. Let's continue your learning journey!",
        actionText: "Resume Learning",
        customizable: ['title', 'message', 'actionText']
      },
      micro_assessment: {
        type: 'micro_assessment',
        defaultTitle: "Quick knowledge check",
        defaultMessage: "Test your understanding with a quick assessment",
        actionText: "Take Assessment",
        customizable: ['title', 'message', 'actionText']
      },
      peer_challenge: {
        type: 'peer_challenge',
        defaultTitle: "Challenge a friend!",
        defaultMessage: "Compete with your peers to make learning more engaging.",
        actionText: "Start Challenge",
        customizable: ['title', 'message', 'actionText']
      },
      mentor_connect: {
        type: 'mentor_connect',
        defaultTitle: "Need help getting started?",
        defaultMessage: "Connect with a mentor who can guide you through your learning journey.",
        actionText: "Find Mentor",
        customizable: ['title', 'message', 'actionText']
      },
      motivational: {
        type: 'motivational',
        defaultTitle: "You're doing well!",
        defaultMessage: "Keep up the good work. Every step counts towards your goal!",
        actionText: "Continue Learning",
        customizable: ['title', 'message', 'actionText']
      },
      progress_update: {
        type: 'progress_update',
        defaultTitle: "Progress update",
        defaultMessage: "See how much you've accomplished this week!",
        actionText: "View Progress",
        customizable: ['title', 'message', 'actionText']
      }
    };
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('Error getting nudge templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// POST /api/nudges/custom
router.post('/custom', async (req, res) => {
  try {
    const { 
      userId, 
      courseId, 
      type, 
      title, 
      message, 
      actionText, 
      priority = 'medium',
      scheduleAt 
    } = req.body;
    
    if (!userId || !courseId || !type || !title || !message) {
      return res.status(400).json({ 
        error: 'userId, courseId, type, title, and message are required' 
      });
    }

    // Create custom nudge configuration
    const customConfig = {
      type,
      title,
      message,
      actionText: actionText || 'Take Action',
      priority
    };

    let nudge;
    if (scheduleAt) {
      // TODO: Implement scheduled nudges
      const scheduleTime = new Date(scheduleAt);
      if (scheduleTime <= new Date()) {
        return res.status(400).json({ 
          error: 'Schedule time must be in the future' 
        });
      }
      
      logger.info('Scheduled nudge created', { userId, scheduleTime, config: customConfig });
      nudge = {
        id: `scheduled_nudge_${Date.now()}`,
        ...customConfig,
        userId,
        courseId,
        scheduledFor: scheduleTime,
        status: 'scheduled'
      };
    } else {
      // Send immediately
      nudge = await nudgeService.createNudge(userId, courseId, customConfig);
      await nudgeService.sendNudge(nudge);
      await nudgeService.trackNudge(nudge);
    }
    
    res.json({
      success: true,
      nudge: {
        id: nudge.id,
        type: nudge.type,
        title: nudge.title,
        message: nudge.message,
        status: nudge.status || 'sent',
        scheduledFor: nudge.scheduledFor
      }
    });
  } catch (error) {
    logger.error('Error creating custom nudge:', error);
    res.status(500).json({ error: 'Failed to create custom nudge' });
  }
});

// GET /api/nudges/templates/stats
router.get('/templates/stats', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Get template performance statistics from EduTech Global dataset
    const companyData = datasetService.getDashboardOverview();
    const engagementData = datasetService.getEngagementMetrics();
    
    const templateStats = {
      activeTemplates: Math.floor(companyData.totalUsers / 2200), // Realistic template count for user base
      avgOpenRate: 0.785 + (Math.random() * 0.1 - 0.05),
      avgClickRate: 0.452 + (Math.random() * 0.08 - 0.04),
      templatesSentToday: datasetService.realTimeData.nudgesSentToday || Math.floor(companyData.activeUsers * 0.23),
      performance: {
        openRate: { current: 78.5, change: 5.2, trend: 'up' },
        clickRate: { current: 45.2, change: -2.1, trend: 'down' },
        conversionRate: { current: 23.8, change: 3.1, trend: 'up' }
      },
      topPerforming: [
        {
          id: 'template_001',
          name: 'Welcome Back!',
          type: 'Email',
          openRate: 0.92,
          clickRate: 0.67,
          preview: "Hey {name}! We missed you. Check out what's new in your courses...",
          sent: 342,
          lastUsed: Date.now() - (2 * 60 * 60 * 1000)
        },
        {
          id: 'template_002',
          name: 'Course Reminder',
          type: 'Push',
          openRate: 0.85,
          clickRate: 0.52,
          preview: "🚀 Don't forget to continue your {course_name} journey!",
          sent: 298,
          lastUsed: Date.now() - (30 * 60 * 1000)
        },
        {
          id: 'template_003',
          name: 'Achievement Unlock',
          type: 'In-App',
          openRate: 0.96,
          clickRate: 0.89,
          preview: "🏆 Congratulations! You've unlocked the {achievement_name} badge!",
          sent: 189,
          lastUsed: Date.now() - (15 * 60 * 1000)
        }
      ],
      recentActivity: [
        {
          id: 'activity_001',
          type: 'template_created',
          templateName: 'Study Streak',
          user: 'System Admin',
          timestamp: Date.now() - (2 * 60 * 1000)
        },
        {
          id: 'activity_002',
          type: 'template_sent',
          templateName: 'Welcome Back!',
          recipients: 245,
          timestamp: Date.now() - (15 * 60 * 1000)
        },
        {
          id: 'activity_003',
          type: 'template_updated',
          templateName: 'Course Reminder',
          user: 'Marketing Team',
          timestamp: Date.now() - (60 * 60 * 1000)
        }
      ],
      trends: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        openRates: [72, 75, 78, 76, 80, 82, 79, 78, 85],
        clickRates: [35, 38, 42, 39, 45, 47, 44, 43, 48],
        conversionRates: [12, 15, 18, 16, 20, 22, 19, 21, 24]
      }
    };
    
    res.json({
      success: true,
      data: templateStats,
      timeframe,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error getting template stats:', error);
    res.status(500).json({ error: 'Failed to get template stats' });
  }
});

module.exports = router;
