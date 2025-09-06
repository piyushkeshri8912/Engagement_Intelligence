const logger = require('../utils/logger');
const redisClient = require('../utils/redis');

class NudgeService {
  constructor() {
    this.nudgeTypes = {
      REMINDER: 'reminder',
      MICRO_ASSESSMENT: 'micro_assessment',
      PEER_CHALLENGE: 'peer_challenge',
      MENTOR_CONNECT: 'mentor_connect',
      MOTIVATIONAL: 'motivational',
      PROGRESS_UPDATE: 'progress_update'
    };

    this.nudgeTemplates = {
      low_engagement: {
        type: this.nudgeTypes.REMINDER,
        title: "Don't lose momentum!",
        message: "You were making great progress. Let's continue your learning journey!",
        actionText: "Resume Learning",
        priority: 'high'
      },
      medium_engagement: {
        type: this.nudgeTypes.MOTIVATIONAL,
        title: "You're doing well!",
        message: "Keep up the good work. Try a quick challenge to boost your engagement.",
        actionText: "Take Challenge",
        priority: 'medium'
      },
      inactivity: {
        type: this.nudgeTypes.REMINDER,
        title: "We miss you!",
        message: "Your learning path is waiting. Come back and continue your progress.",
        actionText: "Continue Learning",
        priority: 'medium'
      },
      peer_challenge: {
        type: this.nudgeTypes.PEER_CHALLENGE,
        title: "Challenge a friend!",
        message: "Compete with your peers to make learning more engaging.",
        actionText: "Start Challenge",
        priority: 'low'
      }
    };
  }

  /**
   * Trigger appropriate nudge based on context
   */
  async triggerNudge(userId, courseId, context) {
    try {
      const { type, urgency, engagementScore } = context;
      
      // Check if user has been recently nudged to avoid spam
      const recentNudges = await this.getRecentNudges(userId);
      if (this.shouldThrottle(recentNudges, type)) {
        logger.info(`Nudge throttled for user ${userId}`, { type });
        return null;
      }

      // Select appropriate nudge strategy
      const nudgeConfig = await this.selectNudgeStrategy(userId, courseId, context);
      
      // Create and send nudge
      const nudge = await this.createNudge(userId, courseId, nudgeConfig);
      await this.sendNudge(nudge);
      
      // Track nudge
      await this.trackNudge(nudge);

      logger.info(`Nudge triggered for user ${userId}`, { 
        type: nudge.type, 
        urgency, 
        engagementScore 
      });

      return nudge;
    } catch (error) {
      logger.error('Error triggering nudge:', error);
      throw error;
    }
  }

  /**
   * Select the best nudge strategy based on user context
   */
  async selectNudgeStrategy(userId, courseId, context) {
    const { type, engagementScore } = context;
    
    // Get user preferences and history
    const userProfile = await this.getUserNudgeProfile(userId);
    const courseProgress = await this.getCourseProgress(userId, courseId);

    let selectedTemplate = this.nudgeTemplates[type] || this.nudgeTemplates.medium_engagement;

    // Personalize based on user behavior
    if (engagementScore < 0.2 && courseProgress.completionRate < 0.1) {
      // Very low engagement, try mentor connection
      selectedTemplate = {
        ...selectedTemplate,
        type: this.nudgeTypes.MENTOR_CONNECT,
        title: "Need help getting started?",
        message: "Connect with a mentor who can guide you through your learning journey.",
        actionText: "Find Mentor"
      };
    } else if (engagementScore > 0.4 && userProfile.prefersChallenges) {
      // User responds well to challenges
      selectedTemplate = this.nudgeTemplates.peer_challenge;
    }

    return selectedTemplate;
  }

  /**
   * Create nudge object
   */
  async createNudge(userId, courseId, config) {
    const nudgeId = `nudge_${userId}_${Date.now()}`;
    
    return {
      id: nudgeId,
      userId,
      courseId,
      type: config.type,
      title: config.title,
      message: config.message,
      actionText: config.actionText,
      priority: config.priority,
      timestamp: Date.now(),
      status: 'pending',
      deliveryChannel: await this.selectDeliveryChannel(userId, config.priority),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Send nudge through appropriate channel
   */
  async sendNudge(nudge) {
    const { deliveryChannel, userId } = nudge;

    switch (deliveryChannel) {
      case 'in_app':
        await this.sendInAppNotification(nudge);
        break;
      case 'email':
        await this.sendEmailNudge(nudge);
        break;
      case 'push':
        await this.sendPushNotification(nudge);
        break;
      case 'websocket':
        await this.sendWebSocketNudge(nudge);
        break;
      default:
        logger.warn(`Unknown delivery channel: ${deliveryChannel}`);
    }

    nudge.status = 'sent';
    nudge.sentAt = Date.now();
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(nudge) {
    // Store notification in Redis for real-time delivery
    await redisClient.lpush(`notifications:${nudge.userId}`, JSON.stringify({
      ...nudge,
      channel: 'in_app'
    }));

    // Emit to WebSocket if user is online
    await this.sendWebSocketNudge(nudge);
  }

  /**
   * Send WebSocket nudge for real-time delivery
   */
  async sendWebSocketNudge(nudge) {
    const io = require('../websockets/socketHandler').getIO();
    if (io) {
      io.to(`user_${nudge.userId}`).emit('nudge', nudge);
    }
  }

  /**
   * Send email nudge (placeholder)
   */
  async sendEmailNudge(nudge) {
    // TODO: Implement email service integration
    logger.info(`Email nudge would be sent to user ${nudge.userId}`, { nudge });
  }

  /**
   * Send push notification (placeholder)
   */
  async sendPushNotification(nudge) {
    // TODO: Implement push notification service
    logger.info(`Push notification would be sent to user ${nudge.userId}`, { nudge });
  }

  /**
   * Select appropriate delivery channel based on urgency and user preferences
   */
  async selectDeliveryChannel(userId, priority) {
    // TODO: Get user preferences from database
    const userPrefs = { preferredChannel: 'in_app' };

    if (priority === 'high') {
      return 'websocket'; // Immediate delivery
    } else if (priority === 'medium') {
      return userPrefs.preferredChannel || 'in_app';
    } else {
      return 'email'; // Low priority can be email
    }
  }

  /**
   * Check if nudges should be throttled
   */
  shouldThrottle(recentNudges, type) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDayinMs = 24 * 60 * 60 * 1000;

    // Don't send more than 3 nudges per hour
    const recentHourNudges = recentNudges.filter(n => now - n.timestamp < oneHour);
    if (recentHourNudges.length >= 3) {
      return true;
    }

    // Don't send same type of nudge within 6 hours
    const samTypeRecent = recentNudges.filter(n => 
      n.type === type && now - n.timestamp < (6 * oneHour)
    );
    if (samTypeRecent.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Get recent nudges for a user
   */
  async getRecentNudges(userId, hours = 24) {
    try {
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      const nudges = await redisClient.get(`user_nudges:${userId}`);
      
      if (!nudges) return [];
      
      return JSON.parse(nudges).filter(n => n.timestamp > cutoff);
    } catch (error) {
      logger.error('Error getting recent nudges:', error);
      return [];
    }
  }

  /**
   * Track nudge delivery and engagement
   */
  async trackNudge(nudge) {
    try {
      // Store in Redis for quick access
      const userNudges = await this.getRecentNudges(nudge.userId, 7 * 24); // 7 days
      userNudges.push(nudge);
      
      // Keep only recent nudges
      const recentNudges = userNudges.slice(-50); // Keep last 50 nudges
      
      await redisClient.setex(
        `user_nudges:${nudge.userId}`, 
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify(recentNudges)
      );

      // TODO: Store in permanent database for analytics
    } catch (error) {
      logger.error('Error tracking nudge:', error);
    }
  }

  /**
   * Mark nudge as interacted (clicked, dismissed, etc.)
   */
  async trackNudgeInteraction(nudgeId, interactionType, userId) {
    try {
      const interaction = {
        nudgeId,
        userId,
        type: interactionType, // 'clicked', 'dismissed', 'completed'
        timestamp: Date.now()
      };

      await redisClient.lpush('nudge_interactions', JSON.stringify(interaction));
      
      logger.info(`Nudge interaction tracked`, interaction);
    } catch (error) {
      logger.error('Error tracking nudge interaction:', error);
    }
  }

  /**
   * Get user nudge profile (preferences and effectiveness)
   */
  async getUserNudgeProfile(userId) {
    // TODO: Implement database query for user preferences
    return {
      prefersChallenges: true,
      bestTimeToNudge: '14:00', // 2 PM
      effectiveNudgeTypes: ['peer_challenge', 'reminder'],
      timezone: 'UTC'
    };
  }

  /**
   * Get course progress for nudge personalization
   */
  async getCourseProgress(userId, courseId) {
    // TODO: Implement database query for course progress
    return {
      completionRate: 0.45,
      currentModule: 3,
      totalModules: 8,
      lastActivity: Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
    };
  }

  /**
   * Schedule recurring nudges
   */
  scheduleRecurringNudges() {
    const cron = require('node-cron');
    
    // Daily engagement check at 2 PM
    cron.schedule('0 14 * * *', async () => {
      logger.info('Running daily engagement check...');
      // TODO: Implement daily engagement analysis and nudge triggering
    });

    // Weekly summary nudges on Sunday at 6 PM
    cron.schedule('0 18 * * 0', async () => {
      logger.info('Sending weekly progress updates...');
      // TODO: Implement weekly progress nudges
    });
  }
}

module.exports = new NudgeService();
