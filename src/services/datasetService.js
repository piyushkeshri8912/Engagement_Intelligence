const logger = require('../utils/logger');

/**
 * EduTech Global Dataset Service
 * Simulates a large-scale online learning platform with 50K+ users
 * Based on real industry metrics and user behavior patterns
 */

class DatasetService {
    constructor() {
        this.companyName = "EduTech Global";
        this.userBase = 52340;
        this.coursesOffered = 847;
        this.instructors = 1240;
        this.averageMonthlyChurn = 0.08; // 8% monthly churn (industry standard)
        
        // Initialize realistic data
        this.initializeUsers();
        this.initializeCourses();
        this.initializeLearningPaths();
        this.initializeRealTimeMetrics();
        
        // Start real-time simulation
        this.startRealTimeSimulation();
        
        logger.info('EduTech Global dataset initialized', {
            users: this.userBase,
            courses: this.coursesOffered,
            instructors: this.instructors
        });
    }
    
    initializeUsers() {
        // Realistic user segments based on industry data
        this.userSegments = {
            enterprise: { 
                count: Math.floor(this.userBase * 0.35), // 35% enterprise learners
                avgEngagement: 0.78,
                retention: 0.89,
                avgSessionTime: 45 // minutes
            },
            individual: {
                count: Math.floor(this.userBase * 0.45), // 45% individual learners  
                avgEngagement: 0.65,
                retention: 0.72,
                avgSessionTime: 32
            },
            student: {
                count: Math.floor(this.userBase * 0.20), // 20% students
                avgEngagement: 0.71,
                retention: 0.68,
                avgSessionTime: 38
            }
        };
        
        // Geographic distribution
        this.userGeography = {
            'North America': Math.floor(this.userBase * 0.35),
            'Europe': Math.floor(this.userBase * 0.28),
            'Asia Pacific': Math.floor(this.userBase * 0.22),
            'Latin America': Math.floor(this.userBase * 0.10),
            'Others': Math.floor(this.userBase * 0.05)
        };
        
        // Realistic user behavior patterns
        this.behaviorPatterns = {
            weekdayPeak: { start: 9, end: 17 }, // 9 AM - 5 PM
            weekendPeak: { start: 10, end: 15 }, // 10 AM - 3 PM
            dropoffPoints: [0.15, 0.35, 0.58, 0.87], // Course completion percentages where users typically drop
            engagementCurve: this.generateEngagementCurve()
        };
    }
    
    initializeCourses() {
        this.courseCategories = {
            'Technology & Programming': {
                courses: 234,
                avgRating: 4.6,
                completionRate: 0.67,
                enrollmentTrend: 0.15, // 15% growth
                popularCourses: [
                    'Full Stack Web Development',
                    'Python for Data Science', 
                    'Machine Learning Fundamentals',
                    'Cloud Computing with AWS',
                    'React.js Masterclass'
                ]
            },
            'Business & Management': {
                courses: 187,
                avgRating: 4.4,
                completionRate: 0.73,
                enrollmentTrend: 0.08,
                popularCourses: [
                    'Project Management Essentials',
                    'Digital Marketing Strategy',
                    'Leadership Development',
                    'Data Analytics for Business',
                    'Agile Methodology'
                ]
            },
            'Design & Creative': {
                courses: 156,
                avgRating: 4.5,
                completionRate: 0.61,
                enrollmentTrend: 0.12,
                popularCourses: [
                    'UI/UX Design Principles',
                    'Adobe Creative Suite',
                    'Graphic Design Fundamentals',
                    'Motion Graphics',
                    '3D Modeling & Animation'
                ]
            },
            'Data Science & Analytics': {
                courses: 143,
                avgRating: 4.7,
                completionRate: 0.58,
                enrollmentTrend: 0.22,
                popularCourses: [
                    'Advanced Machine Learning',
                    'Big Data Analytics',
                    'Statistical Analysis with R',
                    'Deep Learning with TensorFlow',
                    'Business Intelligence'
                ]
            },
            'Personal Development': {
                courses: 127,
                avgRating: 4.3,
                completionRate: 0.69,
                enrollmentTrend: 0.06,
                popularCourses: [
                    'Time Management Mastery',
                    'Public Speaking',
                    'Critical Thinking',
                    'Emotional Intelligence',
                    'Career Development'
                ]
            }
        };
    }
    
    initializeLearningPaths() {
        this.learningPaths = [
            {
                name: 'Full Stack Developer',
                courses: 12,
                duration: 180, // days
                enrollees: 8420,
                completionRate: 0.43,
                avgSalaryIncrease: 0.28
            },
            {
                name: 'Data Scientist',
                courses: 15,
                duration: 210,
                enrollees: 6780,
                completionRate: 0.38,
                avgSalaryIncrease: 0.35
            },
            {
                name: 'Digital Marketing Professional',
                courses: 8,
                duration: 120,
                enrollees: 5920,
                completionRate: 0.52,
                avgSalaryIncrease: 0.22
            },
            {
                name: 'Cloud Architect',
                courses: 10,
                duration: 150,
                enrollees: 4340,
                completionRate: 0.41,
                avgSalaryIncrease: 0.32
            }
        ];
    }
    
    initializeRealTimeMetrics() {
        // Initialize with basic structure first
        this.realTimeData = {
            currentActiveUsers: this.generateActiveUsers(),
            sessionsToday: 0,
            coursesCompletedToday: 0,
            newSignupsToday: 0,
            nudgesSentToday: 0,
            engagementScore: 0.74,
            systemLoad: 0, // Initialize to 0 first
            peakHours: this.calculatePeakHours(),
            churnRisk: this.calculateChurnRisk()
        };
        
        // Now safely generate system load after realTimeData is initialized
        this.realTimeData.systemLoad = this.generateSystemLoad();
    }
    
    generateEngagementCurve() {
        // Realistic engagement curve: high initial, dip around 30%, recovery, final drop
        return [
            0.85, 0.82, 0.79, 0.75, 0.68, 0.62, 0.58, 0.56, 0.59, 0.63,
            0.67, 0.71, 0.74, 0.76, 0.78, 0.79, 0.77, 0.74, 0.69, 0.64
        ];
    }
    
    generateActiveUsers() {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        // Base active users calculation
        let baseActiveUsers = Math.floor(this.userBase * 0.12); // 12% daily active users
        
        // Apply time-based multipliers
        const hourMultiplier = this.getHourMultiplier(hour, dayOfWeek);
        const currentActive = Math.floor(baseActiveUsers * hourMultiplier);
        
        // Add some randomness
        return currentActive + Math.floor(Math.random() * 100) - 50;
    }
    
    getHourMultiplier(hour, dayOfWeek) {
        // Weekend vs weekday patterns
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        if (isWeekend) {
            // Weekend pattern - more spread out
            if (hour >= 10 && hour <= 15) return 0.8;
            if (hour >= 16 && hour <= 20) return 0.6;
            return 0.3;
        } else {
            // Weekday pattern - business hours peak
            if (hour >= 9 && hour <= 11) return 1.2; // Morning peak
            if (hour >= 13 && hour <= 15) return 1.4; // Afternoon peak  
            if (hour >= 19 && hour <= 21) return 1.1; // Evening learning
            if (hour >= 6 && hour <= 8) return 0.7; // Early morning
            if (hour >= 22 && hour <= 23) return 0.5; // Late night
            return 0.3; // Off hours
        }
    }
    
    generateSystemLoad() {
        const baseLoad = Math.random() * 30 + 20; // 20-50% base load
        const activeUsers = this.realTimeData.currentActiveUsers || this.generateActiveUsers();
        
        // Scale load based on active users
        const loadMultiplier = (activeUsers / 6000); // Normalize to expected peak
        return Math.min(baseLoad * loadMultiplier, 95); // Cap at 95%
    }
    
    calculatePeakHours() {
        // Based on user timezone distribution and behavior patterns
        return {
            global: ['09:00-11:00 UTC', '13:00-15:00 UTC', '19:00-21:00 UTC'],
            regional: {
                'North America': '13:00-17:00 EST',
                'Europe': '09:00-17:00 CET', 
                'Asia Pacific': '09:00-17:00 JST'
            }
        };
    }
    
    calculateChurnRisk() {
        // Calculate users at risk based on engagement patterns
        const totalUsers = this.userBase;
        const avgEngagement = 0.74;
        const churnThreshold = 0.4;
        
        return {
            highRisk: Math.floor(totalUsers * 0.08), // 8% high risk
            mediumRisk: Math.floor(totalUsers * 0.15), // 15% medium risk
            lowRisk: Math.floor(totalUsers * 0.77), // 77% low risk
            riskFactors: [
                'Low session frequency (< 2 per week)',
                'Low completion rates (< 30%)',
                'No activity for 7+ days',
                'Poor assessment scores',
                'Limited social interaction'
            ]
        };
    }
    
    // Real-time data generation methods
    getCurrentActiveUsers() {
        return this.generateActiveUsers();
    }
    
    getEngagementMetrics() {
        const now = Date.now();
        return {
            overall: this.realTimeData.engagementScore + (Math.random() * 0.1 - 0.05),
            bySegment: {
                enterprise: this.userSegments.enterprise.avgEngagement + (Math.random() * 0.08 - 0.04),
                individual: this.userSegments.individual.avgEngagement + (Math.random() * 0.08 - 0.04),
                student: this.userSegments.student.avgEngagement + (Math.random() * 0.08 - 0.04)
            },
            byCategory: Object.keys(this.courseCategories).reduce((acc, category) => {
                acc[category] = 0.6 + Math.random() * 0.3;
                return acc;
            }, {}),
            timestamp: now
        };
    }
    
    getRetentionMetrics() {
        return {
            daily: 0.84 + (Math.random() * 0.1 - 0.05),
            weekly: 0.67 + (Math.random() * 0.08 - 0.04),
            monthly: 0.45 + (Math.random() * 0.06 - 0.03),
            quarterly: 0.32 + (Math.random() * 0.04 - 0.02),
            cohortAnalysis: this.generateCohortData(),
            dropoffPoints: this.behaviorPatterns.dropoffPoints,
            riskSegments: this.calculateChurnRisk()
        };
    }
    
    generateCohortData() {
        const cohorts = [];
        const now = new Date();
        
        for (let i = 0; i < 12; i++) {
            const cohortDate = new Date(now);
            cohortDate.setMonth(cohortDate.getMonth() - i);
            
            const initialSize = 1000 + Math.floor(Math.random() * 2000);
            const retentionRate = 0.85 - (i * 0.03); // Decreasing retention over time
            
            cohorts.push({
                cohort: cohortDate.toISOString().slice(0, 7), // YYYY-MM format
                initialSize,
                currentActive: Math.floor(initialSize * retentionRate),
                retentionRate: retentionRate,
                lifetimeValue: (initialSize * 89.99 * retentionRate).toFixed(2) // Avg subscription price
            });
        }
        
        return cohorts;
    }
    
    getRealTimeActivity() {
        const activities = [];
        const activityTypes = [
            'course_started', 'lesson_completed', 'quiz_passed', 'certificate_earned',
            'discussion_posted', 'assignment_submitted', 'video_watched', 'note_created',
            'bookmark_added', 'achievement_unlocked', 'streak_achieved', 'mentor_session'
        ];
        
        const users = this.generateRealisticUsers(20);
        const courses = this.getPopularCourses();
        
        for (let i = 0; i < 15; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const course = courses[Math.floor(Math.random() * courses.length)];
            const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            
            activities.push({
                id: `activity_${Date.now()}_${i}`,
                type: activityType,
                user: user,
                course: course,
                timestamp: Date.now() - (Math.random() * 1800000), // Last 30 minutes
                details: this.generateActivityDetails(activityType, user, course),
                engagement_score: this.calculateUserEngagement(user),
                location: user.location
            });
        }
        
        return activities.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    generateRealisticUsers(count) {
        const firstNames = [
            'Alex', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'John', 'Maria',
            'James', 'Jennifer', 'Robert', 'Linda', 'William', 'Patricia', 'Richard',
            'Susan', 'Joseph', 'Jessica', 'Thomas', 'Karen', 'Christopher', 'Nancy',
            'Daniel', 'Helen', 'Matthew', 'Sandra', 'Anthony', 'Donna', 'Mark', 'Carol'
        ];
        
        const lastNames = [
            'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
            'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
            'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez'
        ];
        
        const locations = Object.keys(this.userGeography);
        const companies = [
            'TechCorp Inc', 'Global Systems', 'InnovateNow', 'Digital Solutions',
            'FutureTech', 'SmartBiz', 'DataDriven Co', 'CloudFirst', 'AgileWorks',
            'Freelancer', 'Startup Labs', 'Enterprise Plus', 'MegaCorp', 'LocalBiz'
        ];
        
        const users = [];
        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            
            users.push({
                id: `user_${Math.floor(Math.random() * 100000)}`,
                name: `${firstName} ${lastName}`,
                avatar: `${firstName[0]}${lastName[0]}`,
                location: locations[Math.floor(Math.random() * locations.length)],
                company: companies[Math.floor(Math.random() * companies.length)],
                joinDate: this.generateJoinDate(),
                segment: this.assignUserSegment(),
                coursesCompleted: Math.floor(Math.random() * 25),
                currentStreak: Math.floor(Math.random() * 30),
                skillLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)]
            });
        }
        
        return users;
    }
    
    generateJoinDate() {
        const now = new Date();
        const monthsAgo = Math.floor(Math.random() * 24); // Up to 2 years ago
        const joinDate = new Date(now);
        joinDate.setMonth(joinDate.getMonth() - monthsAgo);
        return joinDate;
    }
    
    assignUserSegment() {
        const random = Math.random();
        if (random < 0.35) return 'enterprise';
        if (random < 0.80) return 'individual';
        return 'student';
    }
    
    getPopularCourses() {
        const allCourses = [];
        Object.values(this.courseCategories).forEach(category => {
            allCourses.push(...category.popularCourses);
        });
        return allCourses;
    }
    
    generateActivityDetails(activityType, user, course) {
        const details = {
            course_started: `Started learning "${course}" - ${user.skillLevel} level track`,
            lesson_completed: `Completed lesson in "${course}" with 95% score`,
            quiz_passed: `Passed quiz in "${course}" - scored ${85 + Math.floor(Math.random() * 15)}%`,
            certificate_earned: `Earned completion certificate for "${course}"`,
            discussion_posted: `Posted question in "${course}" discussion forum`,
            assignment_submitted: `Submitted final project for "${course}"`,
            video_watched: `Watched 45min video lecture in "${course}"`,
            note_created: `Created study notes for "${course}" module`,
            bookmark_added: `Bookmarked important resource in "${course}"`,
            achievement_unlocked: `Unlocked "Fast Learner" achievement in "${course}"`,
            streak_achieved: `Achieved ${user.currentStreak}-day learning streak`,
            mentor_session: `Completed 1-on-1 mentor session for "${course}"`
        };
        
        return details[activityType] || `Activity in "${course}"`;
    }
    
    calculateUserEngagement(user) {
        const baseEngagement = this.userSegments[user.segment].avgEngagement;
        const randomVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const streakBonus = Math.min(user.currentStreak * 0.01, 0.1); // Up to 10% bonus for streaks
        
        return Math.max(0.1, Math.min(1.0, baseEngagement + randomVariation + streakBonus));
    }
    
    // Start real-time simulation
    startRealTimeSimulation() {
        // Update active users every 30 seconds
        setInterval(() => {
            this.realTimeData.currentActiveUsers = this.generateActiveUsers();
            this.realTimeData.systemLoad = this.generateSystemLoad();
        }, 30000);
        
        // Update daily metrics every minute
        setInterval(() => {
            this.realTimeData.sessionsToday += Math.floor(Math.random() * 10) + 5;
            this.realTimeData.coursesCompletedToday += Math.floor(Math.random() * 3);
            this.realTimeData.newSignupsToday += Math.floor(Math.random() * 2);
            this.realTimeData.nudgesSentToday += Math.floor(Math.random() * 8) + 2;
        }, 60000);
        
        logger.info('Real-time data simulation started for EduTech Global');
    }
    
    // Getter methods for dashboard APIs
    getDashboardOverview() {
        return {
            company: this.companyName,
            totalUsers: this.userBase,
            activeUsers: this.realTimeData.currentActiveUsers,
            coursesOffered: this.coursesOffered,
            instructors: this.instructors,
            engagementScore: this.realTimeData.engagementScore,
            retentionRate: 0.92,
            churnRate: this.averageMonthlyChurn,
            revenue: {
                monthly: 4200000,
                annual: 47500000,
                arpu: 89.99
            },
            growth: {
                userGrowth: 0.15, // 15% monthly
                revenueGrowth: 0.18,
                courseGrowth: 0.08
            }
        };
    }
    
    getSystemHealth() {
        return {
            status: this.realTimeData.systemLoad < 80 ? 'Operational' : 'High Load',
            uptime: 99.7,
            responseTime: 145 + Math.floor(Math.random() * 30),
            activeConnections: this.realTimeData.currentActiveUsers * 1.2,
            systemLoad: this.realTimeData.systemLoad,
            errorRate: Math.random() * 0.5,
            throughput: Math.floor(this.realTimeData.currentActiveUsers * 2.3),
            peakCapacity: '85%'
        };
    }
}

// Singleton instance
const datasetService = new DatasetService();

module.exports = datasetService;
