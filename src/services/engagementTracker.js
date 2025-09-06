const logger = require('../utils/logger');
const redisClient = require('../utils/redis');

class EngagementTracker {
  constructor() {
    this.sessionMetrics = new Map();
    this.engagementThresholds = {
      LOW_ENGAGEMENT: 0.3,
      MEDIUM_ENGAGEMENT: 0.6,
      HIGH_ENGAGEMENT: 0.8
    };
  }

  /**
   * Track user session start
   */
  async startSession(userId, courseId, metadata = {}) {
    const sessionId = `session_${userId}_${Date.now()}`;
    const sessionData = {
      userId,
      courseId,
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      interactions: 0,
      pageViews: 0,
      timeSpent: 0,
      completedActivities: [],
      metadata
    };

    // Store in Redis for real-time access
    await redisClient.setex(`session:${sessionId}`, 3600, JSON.stringify(sessionData));
    
    logger.info(`Session started for user ${userId} in course ${courseId}`, { sessionId });
    return sessionId;
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId, activityData) {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        logger.warn(`Session ${sessionId} not found`);
        return null;
      }

      // Update metrics
      sessionData.lastActivity = Date.now();
      sessionData.interactions++;
      sessionData.timeSpent = Date.now() - sessionData.startTime;

      if (activityData.type === 'page_view') {
        sessionData.pageViews++;
      }

      if (activityData.type === 'activity_completed') {
        sessionData.completedActivities.push(activityData.activityId);
      }

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(sessionData);
      sessionData.engagementScore = engagementScore;

      // Update in Redis
      await redisClient.setex(`session:${sessionId}`, 3600, JSON.stringify(sessionData));

      // Check for drop-off risk
      await this.checkDropOffRisk(sessionData);

      return sessionData;
    } catch (error) {
      logger.error('Error updating activity:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement score based on various metrics
   */
  calculateEngagementScore(sessionData) {
    const now = Date.now();
    const sessionDuration = (now - sessionData.startTime) / 1000 / 60; // minutes
    const timeSinceLastActivity = (now - sessionData.lastActivity) / 1000 / 60; // minutes

    // Normalize metrics
    const durationScore = Math.min(sessionDuration / 30, 1); // 30 minutes = max score
    const interactionScore = Math.min(sessionData.interactions / 20, 1); // 20 interactions = max score
    const activityScore = Math.min(sessionData.completedActivities.length / 5, 1); // 5 activities = max score
    const recentActivityScore = Math.max(0, 1 - (timeSinceLastActivity / 10)); // 10 minutes = 0 score

    // Weighted average
    const engagementScore = (
      durationScore * 0.3 +
      interactionScore * 0.25 +
      activityScore * 0.25 +
      recentActivityScore * 0.2
    );

    return Math.round(engagementScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check for drop-off risk and trigger interventions
   */
  async checkDropOffRisk(sessionData) {
    const { engagementScore, userId, courseId } = sessionData;
    const nudgeService = require('./nudgeService');

    if (engagementScore < this.engagementThresholds.LOW_ENGAGEMENT) {
      logger.warn(`Low engagement detected for user ${userId}`, { engagementScore });
      
      // Trigger appropriate nudge
      await nudgeService.triggerNudge(userId, courseId, {
        type: 'low_engagement',
        urgency: 'high',
        engagementScore
      });
    } else if (engagementScore < this.engagementThresholds.MEDIUM_ENGAGEMENT) {
      // Medium risk - gentler intervention
      await nudgeService.triggerNudge(userId, courseId, {
        type: 'medium_engagement',
        urgency: 'medium',
        engagementScore
      });
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    try {
      const sessionData = await redisClient.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * End session
   */
  async endSession(sessionId) {
    try {
      const sessionData = await this.getSession(sessionId);
      if (sessionData) {
        sessionData.endTime = Date.now();
        sessionData.totalDuration = sessionData.endTime - sessionData.startTime;

        // Store final session data in database
        // TODO: Implement database storage

        logger.info(`Session ended: ${sessionId}`, {
          duration: sessionData.totalDuration,
          engagement: sessionData.engagementScore
        });
      }

      // Remove from Redis
      await redisClient.del(`session:${sessionId}`);
    } catch (error) {
      logger.error('Error ending session:', error);
    }
  }

  /**
   * Get engagement statistics for a user
   */
  async getUserEngagementStats(userId, timeframe = '7d') {
    // TODO: Implement database queries for historical data
    return {
      averageEngagement: 0.75,
      totalSessions: 12,
      averageSessionDuration: 25.5,
      completionRate: 0.83
    };
  }
}

module.exports = new EngagementTracker();
