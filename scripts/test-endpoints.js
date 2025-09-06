const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ML_URL = 'http://localhost:5000';

async function testEndpoint(url, name) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ ${name}: ${response.status} - ${response.data.status || 'OK'}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function testApiEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const tests = [
    // Health checks
    { url: `${BASE_URL}/health`, name: 'Main App Health' },
    { url: `${ML_URL}/health`, name: 'ML Service Health' },
    
    // Dashboard endpoints
    { url: `${BASE_URL}/api/dashboard/overview`, name: 'Dashboard Overview' },
    { url: `${BASE_URL}/api/dashboard/alerts`, name: 'Dashboard Alerts' },
    { url: `${BASE_URL}/api/dashboard/live-feed`, name: 'Live Feed' },
    { url: `${BASE_URL}/api/dashboard/metrics/summary`, name: 'Metrics Summary' },
    
    // Analytics endpoints
    { url: `${BASE_URL}/api/analytics/engagement/overview`, name: 'Analytics Overview' },
    { url: `${BASE_URL}/api/analytics/users/at-risk`, name: 'At-Risk Users' },
    { url: `${BASE_URL}/api/analytics/nudges/effectiveness`, name: 'Nudge Effectiveness' },
    { url: `${BASE_URL}/api/analytics/realtime/stats`, name: 'Realtime Stats' },
    
    // Nudge endpoints
    { url: `${BASE_URL}/api/nudges/templates`, name: 'Nudge Templates' },
    
    // ML Service endpoints
    { url: `${ML_URL}/model/info`, name: 'ML Model Info' },
    { url: `${ML_URL}/analytics/engagement-trends`, name: 'ML Engagement Trends' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    if (await testEndpoint(test.url, test.name)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your application is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check that all services are running.');
  }
}

// Test WebSocket connection
async function testWebSocket() {
  return new Promise((resolve) => {
    const io = require('socket.io-client');
    const socket = io(BASE_URL);
    
    const timeout = setTimeout(() => {
      console.log('❌ WebSocket Connection: Timeout');
      socket.disconnect();
      resolve(false);
    }, 5000);
    
    socket.on('connect', () => {
      console.log('✅ WebSocket Connection: Connected successfully');
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      console.log(`❌ WebSocket Connection: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Engagement Intelligence Tests\n');
  
  await testApiEndpoints();
  console.log('\n🔌 Testing WebSocket Connection...');
  await testWebSocket();
  
  console.log('\n✨ Testing complete!');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testApiEndpoints, testWebSocket };
