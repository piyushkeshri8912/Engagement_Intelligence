const express = require('express');
const router = express.Router();
const datasetService = require('../services/datasetService');
const realTimeDataService = require('../services/realTimeDataService');
const logger = require('../utils/logger');
const redisClient = require('../utils/redis');

// GET /api/dashboard/overview
router.get('/overview', async (req, res) => {
  try {
    const { courseId, timeframe = '24h' } = req.query;
    
    // Get real-time metrics from simulation service
    const realTimeMetrics = realTimeDataService.getCurrentMetrics();
    const companyData = datasetService.getDashboardOverview();
    const engagementData = datasetService.getEngagementMetrics();
    const retentionData = datasetService.getRetentionMetrics();
    
    const overview = {
      summary: {
        totalActiveUsers: realTimeMetrics.activeUsers,
        averageEngagementScore: realTimeMetrics.engagementScore,
        totalSessions: realTimeMetrics.totalSessions,
        dropOffAlerts: Math.floor(realTimeMetrics.activeUsers * realTimeMetrics.dropOffRate),
        nudgesSentToday: datasetService.realTimeData.nudgesSentToday || 89,
        nudgeClickRate: realTimeMetrics.nudgeClickRate
      },
      engagementDistribution: {
        high: { count: Math.floor(realTimeMetrics.activeUsers * 0.4), percentage: 40.0 },
        medium: { count: Math.floor(realTimeMetrics.activeUsers * 0.35), percentage: 35.0 },
        low: { count: Math.floor(realTimeMetrics.activeUsers * 0.25), percentage: 25.0 }
      },
      recentActivity: [
        {
          type: 'high_engagement',
          userId: 'user123',
          userName: 'Alice Johnson',
          courseId: 'course456',
          courseName: 'Advanced React',
          engagementScore: 0.89,
          timestamp: Date.now() - (5 * 60 * 1000)
        },
        {
          type: 'nudge_sent',
          userId: 'user456',
          userName: 'Bob Smith',
          nudgeType: 'reminder',
          courseId: 'course789',
          courseName: 'Python Fundamentals',
          timestamp: Date.now() - (12 * 60 * 1000)
        },
        {
          type: 'drop_off_risk',
          userId: 'user789',
          userName: 'Carol Davis',
          engagementScore: 0.23,
          courseId: 'course123',
          courseName: 'Data Science Basics',
          timestamp: Date.now() - (18 * 60 * 1000)
        }
      ],
      topCourses: [
        {
          courseId: 'course456',
          courseName: 'Advanced React',
          activeUsers: 45,
          avgEngagement: 0.78,
          completionRate: 0.68
        },
        {
          courseId: 'course789',
          courseName: 'Python Fundamentals',
          activeUsers: 38,
          avgEngagement: 0.74,
          completionRate: 0.72
        },
        {
          courseId: 'course123',
          courseName: 'Data Science Basics',
          activeUsers: 32,
          avgEngagement: 0.69,
          completionRate: 0.65
        }
      ],
      hourlyTrends: Array.from({ length: 24 }, (_, i) => {
        const hourMultiplier = i >= 9 && i <= 17 ? 1.2 : i >= 19 && i <= 21 ? 1.0 : 0.5;
        return {
          hour: i,
          activeUsers: Math.floor((realTimeMetrics.activeUsers * hourMultiplier * (0.8 + Math.random() * 0.4)) / 24),
          avgEngagement: Math.max(0.3, realTimeMetrics.engagementScore + (Math.random() - 0.5) * 0.2),
          nudgesSent: Math.floor(Math.random() * 20) + 5
        };
      })
    };

    res.json({
      success: true,
      data: overview,
      timestamp: Date.now(),
      timeframe,
      courseId: courseId || 'all'
    });
  } catch (error) {
    logger.error('Error getting dashboard overview:', error);
    res.status(500).json({ error: 'Failed to get dashboard overview' });
  }
});

// GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity = 'all', limit = 50 } = req.query;
    
    const alerts = [
      {
        id: 'alert_001',
        type: 'drop_off_risk',
        severity: 'high',
        title: 'Multiple users at high drop-off risk',
        message: '15 users in "Machine Learning Basics" have engagement scores below 0.3',
        courseId: 'course_ml_001',
        courseName: 'Machine Learning Basics',
        affectedUsers: 15,
        timestamp: Date.now() - (10 * 60 * 1000),
        status: 'active',
        suggestedActions: ['Send reminder nudges', 'Schedule mentor sessions']
      },
      {
        id: 'alert_002',
        type: 'low_activity',
        severity: 'medium',
        title: 'Declining engagement in course',
        message: 'Average engagement in "Web Development" dropped by 20% in the last 4 hours',
        courseId: 'course_web_001',
        courseName: 'Web Development Bootcamp',
        engagementDrop: 0.20,
        timestamp: Date.now() - (2 * 60 * 60 * 1000),
        status: 'active',
        suggestedActions: ['Investigate content difficulty', 'Send motivational nudges']
      },
      {
        id: 'alert_003',
        type: 'system',
        severity: 'low',
        title: 'Nudge delivery delay',
        message: 'Some nudges experienced delivery delays due to high volume',
        affectedNudges: 23,
        timestamp: Date.now() - (30 * 60 * 1000),
        status: 'resolved',
        suggestedActions: ['Monitor system performance', 'Check delivery queues']
      }
    ];

    // Filter by severity if specified
    const filteredAlerts = severity === 'all' 
      ? alerts 
      : alerts.filter(alert => alert.severity === severity);

    res.json({
      success: true,
      alerts: filteredAlerts.slice(0, parseInt(limit)),
      total: filteredAlerts.length,
      severityFilter: severity
    });
  } catch (error) {
    logger.error('Error getting dashboard alerts:', error);
    res.status(500).json({ error: 'Failed to get dashboard alerts' });
  }
});

// POST /api/dashboard/alerts/:alertId/resolve
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution, notes } = req.body;
    
    // TODO: Implement alert resolution in database
    logger.info('Alert resolved', { 
      alertId, 
      resolution, 
      notes,
      resolvedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alertId,
      resolvedAt: Date.now()
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// GET /api/dashboard/activity/realtime
router.get('/activity/realtime', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const now = Date.now();
    
    // Get real-time activity data from EduTech Global dataset
    const activities = datasetService.getRealTimeActivity();
    const limitedActivities = activities.slice(0, parseInt(limit));
    
    // Helper functions for formatting
    const formatActivityTitle = (activity) => {
      const actionMap = {
        'course_started': 'started',
        'lesson_completed': 'completed lesson in',
        'quiz_passed': 'passed quiz in',
        'certificate_earned': 'earned certificate for',
        'discussion_posted': 'posted in discussion for',
        'assignment_submitted': 'submitted assignment for',
        'video_watched': 'watched video in',
        'note_created': 'created notes for',
        'bookmark_added': 'bookmarked resource in',
        'achievement_unlocked': 'unlocked achievement in',
        'streak_achieved': 'achieved learning streak',
        'mentor_session': 'completed mentor session for'
      };
      const action = actionMap[activity.type] || 'engaged with';
      return `${activity.user.name} ${action} "${activity.course}"`;
    };
    
    const getActivityIcon = (type) => {
      const iconMap = {
        'course_started': 'user',
        'lesson_completed': 'course',
        'quiz_passed': 'achievement',
        'certificate_earned': 'achievement',
        'discussion_posted': 'user',
        'assignment_submitted': 'course',
        'video_watched': 'course',
        'note_created': 'user',
        'bookmark_added': 'user',
        'achievement_unlocked': 'achievement',
        'streak_achieved': 'achievement',
        'mentor_session': 'system'
      };
      return iconMap[type] || 'user';
    };
    
    const getActivityMeta = (type, user) => {
      const metaMap = {
        'course_started': ['🎯 New Start', `🏢 ${user.company}`],
        'lesson_completed': ['🎓 Learning', '✅ Complete'],
        'quiz_passed': ['📝 Assessment', '🎉 Passed'],
        'certificate_earned': ['🎖️ Certificate', '🎆 Earned'],
        'discussion_posted': ['💬 Discussion', '🤝 Community'],
        'assignment_submitted': ['📝 Assignment', '📄 Submitted'],
        'video_watched': ['🎥 Video', '👀 Watched'],
        'note_created': ['📝 Notes', '🧠 Learning'],
        'bookmark_added': ['🔖 Bookmark', '💾 Saved'],
        'achievement_unlocked': ['🏆 Achievement', '⭐ Unlocked'],
        'streak_achieved': ['🔥 Streak', `📅 ${user.currentStreak} days`],
        'mentor_session': ['👨‍🏫 Mentoring', '💬 Session']
      };
      return metaMap[type] || ['📚 Learning', '🔄 Activity'];
    };
    
    // Transform activities to match expected format
    const liveActivities = limitedActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      user: {
        name: activity.user.name,
        avatar: activity.user.avatar,
        id: activity.user.id,
        company: activity.user.company,
        location: activity.user.location
      },
      title: formatActivityTitle(activity),
      description: activity.details,
      timestamp: activity.timestamp,
      icon: getActivityIcon(activity.type),
      meta: getActivityMeta(activity.type, activity.user),
      engagementScore: activity.engagement_score
    }));
    
    // Get real-time metrics from dataset
    const companyData = datasetService.getDashboardOverview();
    const realtimeMetrics = {
      activeNow: companyData.activeUsers,
      activitiesPerMin: 180 + Math.floor(Math.random() * 80), // Based on user base
      engagementRate: datasetService.getEngagementMetrics().overall,
      newSignupsToday: datasetService.realTimeData.newSignupsToday || Math.floor(Math.random() * 50) + 20
    };
    
    res.json({
      success: true,
      activities: liveActivities,
      metrics: realtimeMetrics,
      timestamp: now,
      company: datasetService.companyName,
      totalUsers: companyData.totalUsers
    });
  } catch (error) {
    logger.error('Error getting realtime activity:', error);
    res.status(500).json({ error: 'Failed to get realtime activity' });
  }
});

// GET /api/dashboard/live-feed
router.get('/live-feed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get real-time activity feed
    const liveFeed = [
      {
        id: 'feed_001',
        type: 'session_start',
        userId: 'user123',
        userName: 'Alice Johnson',
        courseId: 'course456',
        courseName: 'Advanced React',
        timestamp: Date.now() - (30 * 1000),
        details: 'Started new learning session'
      },
      {
        id: 'feed_002',
        type: 'high_engagement',
        userId: 'user456',
        userName: 'Bob Smith',
        courseId: 'course789',
        courseName: 'Python Fundamentals',
        engagementScore: 0.87,
        timestamp: Date.now() - (2 * 60 * 1000),
        details: 'Achieved high engagement score'
      },
      {
        id: 'feed_003',
        type: 'nudge_interaction',
        userId: 'user789',
        userName: 'Carol Davis',
        nudgeType: 'reminder',
        interaction: 'clicked',
        timestamp: Date.now() - (5 * 60 * 1000),
        details: 'Clicked on reminder nudge'
      },
      {
        id: 'feed_004',
        type: 'activity_completed',
        userId: 'user321',
        userName: 'David Wilson',
        courseId: 'course123',
        courseName: 'Data Science Basics',
        activityName: 'Linear Regression Quiz',
        timestamp: Date.now() - (8 * 60 * 1000),
        details: 'Completed quiz with 95% score'
      },
      {
        id: 'feed_005',
        type: 'drop_off_warning',
        userId: 'user654',
        userName: 'Eva Martinez',
        courseId: 'course456',
        courseName: 'Advanced React',
        engagementScore: 0.28,
        timestamp: Date.now() - (12 * 60 * 1000),
        details: 'Engagement score dropped below threshold'
      }
    ];
    
    res.json({
      success: true,
      feed: liveFeed.slice(0, parseInt(limit)),
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error getting live feed:', error);
    res.status(500).json({ error: 'Failed to get live feed' });
  }
});

// GET /api/dashboard/metrics/summary
router.get('/metrics/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    const metrics = {
      engagement: {
        current: 0.72,
        previous: 0.68,
        trend: 'up',
        change: 0.04
      },
      activeUsers: {
        current: 342,
        previous: 298,
        trend: 'up',
        change: 44
      },
      sessionDuration: {
        current: 25.8, // minutes
        previous: 23.2,
        trend: 'up',
        change: 2.6
      },
      nudgeEffectiveness: {
        current: 0.64,
        previous: 0.59,
        trend: 'up',
        change: 0.05
      },
      dropOffRate: {
        current: 0.18,
        previous: 0.22,
        trend: 'down',
        change: -0.04
      }
    };

    res.json({
      success: true,
      metrics,
      period,
      lastUpdated: Date.now()
    });
  } catch (error) {
    logger.error('Error getting metrics summary:', error);
    res.status(500).json({ error: 'Failed to get metrics summary' });
  }
});

// GET /api/dashboard/export/report
router.get('/export/report', async (req, res) => {
  try {
    const { format = 'json', timeframe = '24h', includeCharts = false } = req.query;
    
    // TODO: Implement comprehensive report generation
    const reportId = `report_${Date.now()}`;
    
    // Simulate report generation
    const report = {
      id: reportId,
      generatedAt: new Date().toISOString(),
      timeframe,
      format,
      sections: [
        'Executive Summary',
        'Engagement Overview',
        'User Activity Analysis', 
        'Nudge Performance',
        'Risk Analysis',
        'Recommendations'
      ],
      status: 'completed'
    };

    if (format === 'json') {
      res.json({
        success: true,
        report,
        downloadUrl: `/api/dashboard/download/${reportId}`
      });
    } else {
      // For other formats, provide download link
      res.json({
        success: true,
        message: 'Report generation initiated',
        reportId,
        estimatedTime: '2-3 minutes',
        downloadUrl: `/api/dashboard/download/${reportId}`,
        format
      });
    }
  } catch (error) {
    logger.error('Error generating dashboard report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
