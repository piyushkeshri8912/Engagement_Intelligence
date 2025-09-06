const logger = require('../utils/logger');
const EventEmitter = require('events');

/**
 * Real-time Data Simulation Service
 * Generates realistic, time-based fluctuations for engagement metrics
 * Simulates real company data with proper patterns and trends
 */

class RealTimeDataService extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.updateInterval = null;
        this.metrics = this.initializeBaseMetrics();
        this.userSessions = new Map(); // Track active user sessions
        this.simulationSpeed = 30000; // Update every 30 seconds (much more reasonable)
        
        // Realistic patterns based on typical SaaS metrics
        this.patterns = {
            dailyActiveUsers: {
                baseline: 3200,
                peakHours: [9, 10, 11, 14, 15, 16], // Business hours peak
                weekendMultiplier: 0.6,
                seasonalVariation: 0.1
            },
            dropOffRate: {
                baseline: 0.18,
                stressFactors: ['monday_effect', 'lunch_dip', 'friday_fatigue'],
                improvementTrend: -0.002 // Gradual improvement over time
            },
            engagementScore: {
                baseline: 0.74,
                volatility: 0.05,
                trendCycles: 30 // Days for trend cycles
            }
        };
        
        this.startSimulation();
        logger.info('Real-time data service initialized');
    }
    
    initializeBaseMetrics() {
        const now = Date.now();
        return {
            activeUsers: 3247,
            dropOffRate: 0.182,
            engagementScore: 0.743,
            sessionDuration: 24.3,
            nudgeClickRate: 0.642,
            totalSessions: 8934,
            coursesCompleted: 156,
            newSignups: 23,
            lastUpdated: now,
            
            // Additional metrics for realism
            bounceRate: 0.23,
            conversionRate: 0.087,
            retentionRate: 0.769,
            customerSatisfaction: 4.2,
            systemLoad: 0.45,
            apiResponseTime: 142,
            
            // Geographic distribution
            regionalData: {
                'North America': { users: 1140, engagement: 0.78 },
                'Europe': { users: 892, engagement: 0.72 },
                'Asia Pacific': { users: 743, engagement: 0.81 },
                'Latin America': { users: 287, engagement: 0.69 },
                'Africa': { users: 185, engagement: 0.65 }
            },
            
            // Device breakdown
            deviceData: {
                desktop: { users: 1623, engagement: 0.79 },
                mobile: { users: 1134, engagement: 0.71 },
                tablet: { users: 490, engagement: 0.68 }
            }
        };
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
            this.simulateUserActivity();
            this.broadcastUpdates();
        }, this.simulationSpeed);
        
        logger.info('Real-time data simulation started');
    }
    
    stopSimulation() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        logger.info('Real-time data simulation stopped');
    }
    
    updateMetrics() {
        const now = Date.now();
        const hour = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Update active users with realistic patterns
        const baseUsers = this.patterns.dailyActiveUsers.baseline;
        const hourMultiplier = this.getHourMultiplier(hour, isWeekend);
        const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% random variation (much more subtle)
        
        this.metrics.activeUsers = Math.floor(
            baseUsers * hourMultiplier * (1 + randomVariation)
        );
        
        // Update drop-off rate with trend improvements
        const baseDropOff = this.patterns.dropOffRate.baseline;
        const stressFactor = this.getStressFactor(hour, dayOfWeek);
        const trendImprovement = this.patterns.dropOffRate.improvementTrend * (now / (1000 * 60 * 60 * 24));
        
        this.metrics.dropOffRate = Math.max(0.05, 
            baseDropOff + stressFactor + trendImprovement + (Math.random() - 0.5) * 0.005
        );
        
        // Update engagement score with volatility
        const baseEngagement = this.patterns.engagementScore.baseline;
        const volatility = this.patterns.engagementScore.volatility;
        const cycleFactor = Math.sin((now / (1000 * 60 * 60 * 24)) * 2 * Math.PI / 30) * 0.03;
        
        this.metrics.engagementScore = Math.min(0.95, Math.max(0.45,
            baseEngagement + cycleFactor + (Math.random() - 0.5) * (volatility * 0.3)
        ));
        
        // Update session duration based on engagement
        this.metrics.sessionDuration = 15 + (this.metrics.engagementScore * 20) + 
            (Math.random() - 0.5) * 1; // Reduced from 4 to 1 for stability
        
        // Update nudge click rate with some correlation to engagement
        this.metrics.nudgeClickRate = Math.min(0.85, Math.max(0.35,
            0.5 + (this.metrics.engagementScore - 0.5) * 0.4 + (Math.random() - 0.5) * 0.01
        ));
        
        // Update system metrics
        this.metrics.systemLoad = Math.min(0.95, Math.max(0.2,
            0.3 + (this.metrics.activeUsers / 4000) * 0.4 + (Math.random() - 0.5) * 0.1
        ));
        
        this.metrics.apiResponseTime = Math.floor(
            80 + (this.metrics.systemLoad * 100) + (Math.random() * 40)
        );
        
        // Update cumulative metrics occasionally
        if (Math.random() < 0.1) { // 10% chance each update
            this.metrics.totalSessions += Math.floor(Math.random() * 5);
            this.metrics.coursesCompleted += Math.floor(Math.random() * 3);
            this.metrics.newSignups += Math.floor(Math.random() < 0.3 ? 1 : 0);
        }
        
        // Update regional and device data
        this.updateRegionalData();
        this.updateDeviceData();
        
        this.metrics.lastUpdated = now;
    }
    
    getHourMultiplier(hour, isWeekend) {
        if (isWeekend) {
            // Weekend pattern - more spread out, lower overall
            if (hour >= 10 && hour <= 15) return 0.8;
            if (hour >= 16 && hour <= 20) return 0.6;
            return 0.4;
        } else {
            // Weekday pattern - business hours peak
            if (this.patterns.dailyActiveUsers.peakHours.includes(hour)) return 1.2;
            if (hour >= 19 && hour <= 21) return 1.0; // Evening learning
            if (hour >= 6 && hour <= 8) return 0.7; // Early morning
            if (hour >= 22 && hour <= 23) return 0.5; // Late night
            return 0.4; // Off hours
        }
    }
    
    getStressFactor(hour, dayOfWeek) {
        let stress = 0;
        
        // Monday effect - higher drop-off
        if (dayOfWeek === 1) stress += 0.02;
        
        // Lunch dip - attention drops
        if (hour >= 12 && hour <= 13) stress += 0.01;
        
        // Friday fatigue
        if (dayOfWeek === 5 && hour >= 15) stress += 0.015;
        
        return stress;
    }
    
    updateRegionalData() {
        Object.keys(this.metrics.regionalData).forEach(region => {
            const data = this.metrics.regionalData[region];
            data.users = Math.floor(data.users * (1 + (Math.random() - 0.5) * 0.005)); // Reduced volatility
            data.engagement = Math.min(0.95, Math.max(0.5,
                data.engagement + (Math.random() - 0.5) * 0.003 // Much more subtle changes
            ));
        });
    }
    
    updateDeviceData() {
        const totalUsers = this.metrics.activeUsers;
        
        // Maintain realistic device distribution
        this.metrics.deviceData.desktop.users = Math.floor(totalUsers * 0.50);
        this.metrics.deviceData.mobile.users = Math.floor(totalUsers * 0.35);
        this.metrics.deviceData.tablet.users = Math.floor(totalUsers * 0.15);
        
        Object.values(this.metrics.deviceData).forEach(device => {
            device.engagement = Math.min(0.95, Math.max(0.5,
                device.engagement + (Math.random() - 0.5) * 0.002 // Reduced from 0.008 to 0.002
            ));
        });
    }
    
    simulateUserActivity() {
        // Simulate user sessions starting and ending
        const sessionChanges = Math.floor(Math.random() * 10) - 5; // -5 to +5 changes
        
        if (sessionChanges > 0) {
            // Add new sessions
            for (let i = 0; i < sessionChanges; i++) {
                const sessionId = `session_${Date.now()}_${Math.random()}`;
                this.userSessions.set(sessionId, {
                    startTime: Date.now(),
                    userId: `user_${Math.floor(Math.random() * 10000)}`,
                    engagement: Math.random(),
                    course: `course_${Math.floor(Math.random() * 100)}`
                });
            }
        } else if (sessionChanges < 0) {
            // Remove sessions (users leaving)
            const sessions = Array.from(this.userSessions.keys());
            for (let i = 0; i < Math.abs(sessionChanges) && sessions.length > 0; i++) {
                const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
                this.userSessions.delete(randomSession);
            }
        }
    }
    
    broadcastUpdates() {
        // Emit updates for WebSocket broadcasting
        this.emit('metrics_updated', {
            ...this.metrics,
            activeSessions: this.userSessions.size,
            timestamp: Date.now()
        });
        
        // Occasionally emit specific events
        if (Math.random() < 0.05) { // 5% chance
            this.emit('user_alert', {
                type: 'high_engagement',
                userId: `user_${Math.floor(Math.random() * 10000)}`,
                message: 'User showing exceptional engagement',
                timestamp: Date.now()
            });
        }
        
        if (Math.random() < 0.03) { // 3% chance
            this.emit('system_alert', {
                type: 'performance',
                message: this.metrics.systemLoad > 0.8 ? 'High system load detected' : 'System performance optimal',
                level: this.metrics.systemLoad > 0.8 ? 'warning' : 'info',
                timestamp: Date.now()
            });
        }
    }
    
    getCurrentMetrics() {
        return {
            ...this.metrics,
            activeSessions: this.userSessions.size,
            timestamp: Date.now()
        };
    }
    
    // Historical data for trends
    getHistoricalData(hours = 24) {
        const data = [];
        const now = Date.now();
        
        for (let i = hours; i >= 0; i--) {
            const timestamp = now - (i * 60 * 60 * 1000);
            const hour = new Date(timestamp).getHours();
            const dayOfWeek = new Date(timestamp).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            data.push({
                timestamp,
                hour,
                activeUsers: Math.floor(
                    this.patterns.dailyActiveUsers.baseline * 
                    this.getHourMultiplier(hour, isWeekend) * 
                    (0.9 + Math.random() * 0.2)
                ),
                engagementScore: Math.min(0.95, Math.max(0.45,
                    this.patterns.engagementScore.baseline + (Math.random() - 0.5) * 0.1
                )),
                dropOffRate: Math.max(0.05,
                    this.patterns.dropOffRate.baseline + 
                    this.getStressFactor(hour, dayOfWeek) + 
                    (Math.random() - 0.5) * 0.03
                )
            });
        }
        
        return data;
    }
    
    // Simulate specific events
    triggerEvent(eventType, data) {
        switch (eventType) {
            case 'user_signup':
                this.metrics.newSignups++;
                this.metrics.activeUsers++;
                break;
            case 'user_churn':
                this.metrics.activeUsers = Math.max(0, this.metrics.activeUsers - 1);
                this.metrics.dropOffRate += 0.001;
                break;
            case 'course_completion':
                this.metrics.coursesCompleted++;
                this.metrics.engagementScore += 0.001;
                break;
            case 'system_load_spike':
                this.metrics.systemLoad = Math.min(0.95, this.metrics.systemLoad + 0.1);
                break;
        }
        
        this.emit('event_triggered', { eventType, data, timestamp: Date.now() });
    }
}

// Singleton instance
const realTimeDataService = new RealTimeDataService();

module.exports = realTimeDataService;
