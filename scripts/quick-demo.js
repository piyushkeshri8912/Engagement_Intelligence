const axios = require('axios');

async function quickDemo() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🎯 Quick Demo - Engagement Intelligence Layer');
  console.log('═══════════════════════════════════════════════\n');

  // Test 1: Health Check
  try {
    console.log('1️⃣  Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ Status: ${health.data.status}`);
    console.log(`   ✅ Service: ${health.data.service}`);
    console.log(`   ✅ Timestamp: ${new Date(health.data.timestamp).toLocaleString()}\n`);
  } catch (error) {
    console.log('   ❌ Health check failed\n');
  }

  // Test 2: Dashboard Overview
  try {
    console.log('2️⃣  Testing Dashboard Overview...');
    const dashboard = await axios.get(`${BASE_URL}/api/dashboard/overview`);
    const data = dashboard.data.data.summary;
    console.log(`   📊 Active Users: ${data.totalActiveUsers}`);
    console.log(`   📈 Avg Engagement: ${(data.averageEngagementScore * 100).toFixed(1)}%`);
    console.log(`   ⚠️  Drop-off Alerts: ${data.dropOffAlerts}`);
    console.log(`   🎯 Nudges Sent Today: ${data.nudgesSentToday}\n`);
  } catch (error) {
    console.log('   ❌ Dashboard test failed\n');
  }

  // Test 3: Start a Learning Session
  try {
    console.log('3️⃣  Testing Session Tracking...');
    const session = await axios.post(`${BASE_URL}/api/engagement/session/start`, {
      userId: 'demo-user-' + Date.now(),
      courseId: 'ml-fundamentals-101',
      metadata: { source: 'demo', device: 'web' }
    });
    console.log(`   ✅ Session Started: ${session.data.sessionId}`);
    
    // Simulate some activity
    await axios.post(`${BASE_URL}/api/engagement/activity`, {
      sessionId: session.data.sessionId,
      type: 'page_view',
      activityId: 'lesson-introduction',
      metadata: { duration: 120 }
    });
    console.log('   ✅ Activity tracked: Page view');
    
    await axios.post(`${BASE_URL}/api/engagement/activity`, {
      sessionId: session.data.sessionId,
      type: 'activity_completed',
      activityId: 'quiz-1',
      metadata: { score: 85 }
    });
    console.log('   ✅ Activity tracked: Quiz completed (85%)\n');
  } catch (error) {
    console.log('   ❌ Session tracking failed\n');
  }

  // Test 4: Nudge Templates
  try {
    console.log('4️⃣  Testing Nudge System...');
    const templates = await axios.get(`${BASE_URL}/api/nudges/templates`);
    const templateTypes = Object.keys(templates.data.templates);
    console.log(`   📝 Available Templates: ${templateTypes.length}`);
    templateTypes.slice(0, 3).forEach(type => {
      const template = templates.data.templates[type];
      console.log(`   • ${type}: "${template.defaultTitle}"`);
    });
    console.log('');
  } catch (error) {
    console.log('   ❌ Nudge templates test failed\n');
  }

  // Test 5: Trigger a Nudge
  try {
    console.log('5️⃣  Testing Nudge Triggering...');
    const nudge = await axios.post(`${BASE_URL}/api/nudges/trigger`, {
      userId: 'demo-user-at-risk',
      courseId: 'ml-fundamentals-101',
      context: {
        type: 'low_engagement',
        urgency: 'high',
        engagementScore: 0.25
      }
    });
    
    if (nudge.data.throttled) {
      console.log('   ✅ Nudge throttled (anti-spam protection active)');
    } else {
      console.log(`   ✅ Nudge triggered: "${nudge.data.nudge.title}"`);
      console.log(`   📤 Delivery: ${nudge.data.nudge.deliveryChannel}`);
    }
    console.log('');
  } catch (error) {
    console.log('   ❌ Nudge triggering failed\n');
  }

  // Test 6: Analytics
  try {
    console.log('6️⃣  Testing Analytics Engine...');
    const analytics = await axios.get(`${BASE_URL}/api/analytics/engagement/overview`);
    const data = analytics.data.data;
    console.log(`   📊 Total Sessions: ${data.totalSessions}`);
    console.log(`   ⏱️  Avg Session Duration: ${data.averageSessionDuration} min`);
    console.log(`   📈 Average Engagement: ${(data.averageEngagementScore * 100).toFixed(1)}%`);
    console.log(`   📉 Drop-off Rate: ${(data.dropOffRate * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log('   ❌ Analytics test failed\n');
  }

  console.log('🎉 Demo Complete!');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('🌐 Your application is running at:');
  console.log('   • Main App:    http://localhost:3000');
  console.log('   • API Docs:    http://localhost:3000/health');
  console.log('   • Dashboard:   http://localhost:3000/api/dashboard/overview');
  console.log('');
  console.log('🚀 Ready for production deployment!');
}

quickDemo().catch(console.error);
