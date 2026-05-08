const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
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

async function test() {
  console.log('🧪 Running API tests...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const health = await request('GET', '/health');
    console.log(health.status === 200 ? '✅ Health check passed' : '❌ Health check failed');

    // Test 2: Register user
    console.log('\n2️⃣ Testing user registration...');
    const register = await request('POST', '/api/v1/auth/register', {
      email: `test${Date.now()}@example.com`,
      password: 'Test123456',
      name: 'Test User'
    });
    console.log(register.status === 201 ? '✅ Registration passed' : '❌ Registration failed');

    // Test 3: Login
    console.log('\n3️⃣ Testing user login...');
    const login = await request('POST', '/api/v1/auth/login', {
      email: 'user@example.com',
      password: 'user123'
    });
    
    if (login.status === 200 && login.data.token) {
      authToken = login.data.token;
      console.log('✅ Login passed');
    } else {
      console.log('❌ Login failed');
    }

    // Test 4: Get GPUs
    console.log('\n4️⃣ Testing GPU listing...');
    const gpus = await request('GET', '/api/v1/gpus');
    console.log(gpus.status === 200 ? '✅ GPU listing passed' : '❌ GPU listing failed');

    // Test 5: Get subscription plans
    console.log('\n5️⃣ Testing subscription plans...');
    const plans = await request('GET', '/api/v1/subscriptions/plans');
    console.log(plans.status === 200 ? '✅ Subscription plans passed' : '❌ Subscription plans failed');

    // Test 6: Get my rentals
    console.log('\n6️⃣ Testing rental history...');
    const rentals = await request('GET', '/api/v1/rentals/my-rentals');
    console.log(rentals.status === 200 ? '✅ Rental history passed' : '❌ Rental history failed');

    console.log('\n✨ Test suite completed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait for server to be ready
setTimeout(test, 2000);
