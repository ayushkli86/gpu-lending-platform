const http = require('http');

const API_URL = 'http://localhost:3000/api/v1';
let testsPassed = 0;
let testsFailed = 0;
let iteration = 0;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3000');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function log(emoji, message, status = '') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${emoji} ${message} ${status}`);
}

async function testFeature(name, testFn) {
  try {
    await testFn();
    testsPassed++;
    log('✅', name, 'PASSED');
    return true;
  } catch (error) {
    testsFailed++;
    log('❌', name, `FAILED: ${error.message}`);
    return false;
  }
}

async function runTests() {
  iteration++;
  console.log('\n' + '='.repeat(60));
  log('🔄', `TEST ITERATION #${iteration}`);
  console.log('='.repeat(60) + '\n');

  testsPassed = 0;
  testsFailed = 0;
  let token = null;

  // Test 1: Health Check
  await testFeature('Health Check', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error('Health check failed');
    if (res.data.status !== 'ok') throw new Error('Status not ok');
  });

  // Test 2: User Login
  await testFeature('User Login', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    if (res.status !== 200) throw new Error('Login failed');
    if (!res.data.token) throw new Error('No token received');
    token = res.data.token;
  });

  // Test 3: Admin Login
  await testFeature('Admin Login', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    if (res.status !== 200) throw new Error('Admin login failed');
    if (res.data.user.role !== 'ADMIN') throw new Error('Not admin role');
  });

  // Test 4: User Registration
  await testFeature('User Registration', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'test123456'
    });
    if (res.status !== 201) throw new Error('Registration failed');
  });

  // Test 5: Get GPUs
  await testFeature('Get GPUs', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    if (res.status !== 200) throw new Error('Failed to get GPUs');
    if (!res.data.gpus || res.data.gpus.length === 0) throw new Error('No GPUs found');
    if (res.data.gpus.length !== 4) throw new Error('Expected 4 GPUs');
  });

  // Test 6: Get Available GPUs
  await testFeature('Get Available GPUs', async () => {
    const res = await request('GET', `${API_URL}/gpus/available`, null, token);
    if (res.status !== 200) throw new Error('Failed to get available GPUs');
    if (!res.data.gpus) throw new Error('No GPUs data');
  });

  // Test 7: Get My Rentals
  await testFeature('Get My Rentals', async () => {
    const res = await request('GET', `${API_URL}/rentals/my-rentals`, null, token);
    if (res.status !== 200) throw new Error('Failed to get rentals');
    if (!res.data.rentals) throw new Error('No rentals data');
  });

  // Test 8: Get Subscription Plans
  await testFeature('Get Subscription Plans', async () => {
    const res = await request('GET', `${API_URL}/subscriptions/plans`);
    if (res.status !== 200) throw new Error('Failed to get plans');
    if (!res.data.plans || res.data.plans.length === 0) throw new Error('No plans found');
    if (res.data.plans.length !== 3) throw new Error('Expected 3 plans');
  });

  // Test 9: Subscribe to Plan
  await testFeature('Subscribe to Plan', async () => {
    const res = await request('POST', `${API_URL}/subscriptions`, {
      planId: '1'
    }, token);
    if (res.status !== 201) throw new Error('Subscription failed');
  });

  // Test 10: Admin Stats
  await testFeature('Admin Stats', async () => {
    const adminRes = await request('POST', `${API_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin'
    });
    const adminToken = adminRes.data.token;
    
    const res = await request('GET', `${API_URL}/admin/stats`, null, adminToken);
    if (res.status !== 200) throw new Error('Failed to get admin stats');
    if (!res.data.totalUsers) throw new Error('No stats data');
  });

  // Test 11: UI Accessibility
  await testFeature('UI Accessibility', async () => {
    const res = await request('GET', '/');
    if (res.status !== 200) throw new Error('UI not accessible');
  });

  // Test 12: API Documentation
  await testFeature('API Documentation', async () => {
    const res = await request('GET', '/api-docs');
    if (res.status !== 200) throw new Error('API docs not accessible');
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  log('📊', 'TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Platform is working perfectly!\n');
    return true;
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Retrying in 10 seconds...\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 GPU LENDING PLATFORM - AUTOMATED TESTING');
  console.log('Testing all features until 100% success...\n');

  let allPassed = false;
  
  while (!allPassed) {
    try {
      allPassed = await runTests();
      
      if (!allPassed) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      log('💥', 'Critical error:', error.message);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log('✨ Testing complete! All features verified!\n');
  console.log('Press Ctrl+C to exit or wait for manual stop...\n');
}

main().catch(console.error);
