const axios = require('axios');

console.log('🎯 Engagement & Retention Intelligence Demo\n');

async function runDemo() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('📊 Testing Dashboard Overview...');
  try {
    const overview = await axios.get(`${BASE_URL}/api/dashboard/overview`);
    console.log('✅ Dashboard loaded successfully');
    console.log(`   • Active Users: ${overview.data.data.summary.totalActiveUsers}`);
    console.log(`   • Avg Engagement: ${(overview.data.data.summary.averageEngagementScore * 100).toFixed(1)}%`);
    console.log(`   • Drop-off Alerts: ${overview.data.data.summary.dropOffAlerts}`);
  } catch (error) {
    console.log('❌ Dashboard failed:', error.message);
  }

  console.log('\n🚨 Testing Alerts System...');
  try {
    const alerts = await axios.get(`${BASE_URL}/api/dashboard/alerts`);
    console.log('✅ Alerts system working');
    console.log(`   • Active Alerts: ${alerts.data.alerts.length}`);
    alerts.data.alerts.forEach(alert => {
      console.log(`   • ${alert.severity.toUpperCase()}: ${alert.title}`);
    });
  } catch (error) {
    console.log('❌ Alerts failed:', error.message);
  }

  console.log('\n🎯 Testing Nudge Templates...');
  try {
    const templates = await axios.get(`${BASE_URL}/api/nudges/templates`);
    console.log('✅ Nudge system working');
    const templateNames = Object.keys(templates.data.templates);
    console.log(`   • Available Templates: ${templateNames.join(', ')}`);
  } catch (error) {
    console.log('❌ Nudge templates failed:', error.message);
  }

  console.log('\n📈 Testing Analytics...');
  try {
    const analytics = await axios.get(`${BASE_URL}/api/analytics/engagement/overview`);
    console.log('✅ Analytics working');
    console.log(`   • Total Sessions: ${analytics.data.data.totalSessions}`);
    console.log(`   • Average Session Duration: ${analytics.data.data.averageSessionDuration} minutes`);
  } catch (error) {
    console.log('❌ Analytics failed:', error.message);
  }

  console.log('\n🎲 Testing Engagement Tracking...');
  try {
    // Simulate starting a session
    const sessionStart = await axios.post(`${BASE_URL}/api/engagement/session/start`, {
      userId: 'demo-user-123',
      courseId: 'demo-course-456',
      metadata: { source: 'demo' }
    });
    
    console.log('✅ Session tracking working');
    console.log(`   • Session ID: ${sessionStart.data.sessionId}`);
    
    // Simulate some activity
    await axios.post(`${BASE_URL}/api/engagement/activity`, {
      sessionId: sessionStart.data.sessionId,
      type: 'page_view',
      activityId: 'lesson-1',
      metadata: { page: 'Introduction to ML' }
    });
    
    console.log('   • Activity tracked successfully');
    
    // End the session
    await axios.post(`${BASE_URL}/api/engagement/session/end`, {
      sessionId: sessionStart.data.sessionId
    });
    
    console.log('   • Session ended successfully');
    
  } catch (error) {
    console.log('❌ Engagement tracking failed:', error.message);
  }

  console.log('\n🎯 Testing Nudge Triggering...');
  try {
    const nudge = await axios.post(`${BASE_URL}/api/nudges/trigger`, {
      userId: 'demo-user-123',
      courseId: 'demo-course-456',
      context: {
        type: 'low_engagement',
        urgency: 'medium',
        engagementScore: 0.25
      }
    });
    
    if (nudge.data.throttled) {
      console.log('✅ Nudge system working (throttled for spam prevention)');
    } else {
      console.log('✅ Nudge triggered successfully');
      console.log(`   • Nudge Type: ${nudge.data.nudge.type}`);
      console.log(`   • Title: "${nudge.data.nudge.title}"`);
    }
  } catch (error) {
    console.log('❌ Nudge triggering failed:', error.message);
  }

  console.log('\n🏁 Demo Complete!');
  console.log('\n📝 Summary:');
  console.log('   • Full-stack application with real-time engagement tracking');
  console.log('   • Intelligent nudging system with anti-spam protection');
  console.log('   • Comprehensive dashboard with analytics and alerts');
  console.log('   • RESTful API with WebSocket support');
  console.log('   • Graceful degradation when Redis/DB unavailable');
  console.log('\n🌐 Access the application at: http://localhost:3000');
}

if (require.main === module) {
  runDemo().catch(console.error);
}
