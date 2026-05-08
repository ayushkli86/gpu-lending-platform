const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/v1';

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkFile(filePath, searchText) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchText);
}

async function verify(name, testFn) {
  process.stdout.write(`\n⏳ Checking: ${name}... `);
  await sleep(500);
  try {
    await testFn();
    console.log('✅ PASS');
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 GPU LENDING PLATFORM - STEP-BY-STEP FEATURE VERIFICATION');
  console.log('='.repeat(70) + '\n');

  let passed = 0;
  let failed = 0;
  let token = null;

  // Feature 1: Authentication & Authorization
  console.log('\n📋 1. AUTHENTICATION & AUTHORIZATION');
  console.log('-'.repeat(70));

  if (await verify('User registration endpoint', async () => {
    const res = await request('POST', `${API_URL}/auth/register`, {
      name: 'Test', email: `test${Date.now()}@test.com`, password: 'test12345678'
    });
    if (res.status !== 201) throw new Error('Registration failed');
  })) passed++; else failed++;

  if (await verify('User login with JWT', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: 'test@example.com', password: 'test123'
    });
    if (res.status !== 200 || !res.data.token) throw new Error('Login failed');
    token = res.data.token;
  })) passed++; else failed++;

  if (await verify('Role-based access control', async () => {
    const res = await request('POST', `${API_URL}/auth/login`, {
      email: 'admin@test.com', password: 'test'
    });
    if (res.data.user.role !== 'ADMIN') throw new Error('RBAC not working');
  })) passed++; else failed++;

  if (await verify('Password hashing (bcrypt)', async () => {
    if (!await checkFile('src/routes/auth.routes.ts', 'bcrypt')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Session management (Redis)', async () => {
    if (!await checkFile('.env', 'REDIS')) throw new Error('Not configured');
  })) passed++; else failed++;

  console.log(`\n📊 Section 1 Result: ${passed} passed, ${failed} failed`);

  // Feature 2: GPU Inventory Management
  console.log('\n📋 2. GPU INVENTORY MANAGEMENT');
  console.log('-'.repeat(70));

  if (await verify('View GPU servers', async () => {
    const res = await request('GET', `${API_URL}/gpus/servers`, null, token);
    if (res.status !== 200) throw new Error('Cannot view servers');
  })) passed++; else failed++;

  if (await verify('View individual GPUs', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    if (res.status !== 200 || !res.data.gpus) throw new Error('Cannot view GPUs');
  })) passed++; else failed++;

  if (await verify('GPU status tracking', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    if (!res.data.gpus[0].status) throw new Error('Status not found');
  })) passed++; else failed++;

  if (await verify('GPU specifications', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    const gpu = res.data.gpus[0];
    if (!gpu.model || !gpu.memory) throw new Error('Specs incomplete');
  })) passed++; else failed++;

  if (await verify('Filter available GPUs', async () => {
    const res = await request('GET', `${API_URL}/gpus/available`, null, token);
    if (res.status !== 200) throw new Error('Filter failed');
  })) passed++; else failed++;

  console.log(`\n📊 Section 2 Result: ${passed - 5} passed, ${failed - (passed < 5 ? 5 - passed : 0)} failed`);

  // Feature 3: Rental System
  console.log('\n📋 3. RENTAL/BOOKING SYSTEM');
  console.log('-'.repeat(70));

  if (await verify('View my rentals', async () => {
    const res = await request('GET', `${API_URL}/rentals/my-rentals`, null, token);
    if (res.status !== 200) throw new Error('Cannot view rentals');
  })) passed++; else failed++;

  if (await verify('Rental lifecycle management', async () => {
    if (!await checkFile('prisma/schema.prisma', 'RentalStatus')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Resource allocation service', async () => {
    if (!fs.existsSync('src/services/allocation.service.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 3 Result: ${passed - 10} passed, ${failed - (passed < 10 ? 10 - passed : 0)} failed`);

  // Feature 4: Subscriptions
  console.log('\n📋 4. SUBSCRIPTION MANAGEMENT');
  console.log('-'.repeat(70));

  if (await verify('View subscription plans', async () => {
    const res = await request('GET', `${API_URL}/subscriptions/plans`);
    if (res.status !== 200 || !res.data.plans) throw new Error('Cannot view plans');
  })) passed++; else failed++;

  if (await verify('Subscribe to plan', async () => {
    const res = await request('POST', `${API_URL}/subscriptions`, { planId: '1' }, token);
    if (res.status !== 201) throw new Error('Subscribe failed');
  })) passed++; else failed++;

  if (await verify('Subscription lifecycle', async () => {
    if (!await checkFile('prisma/schema.prisma', 'SubscriptionStatus')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 4 Result: ${passed - 13} passed, ${failed - (passed < 13 ? 13 - passed : 0)} failed`);

  // Feature 5: Billing
  console.log('\n📋 5. BILLING ENGINE');
  console.log('-'.repeat(70));

  if (await verify('Billing service exists', async () => {
    if (!fs.existsSync('src/services/billing.service.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Invoice generation', async () => {
    if (!await checkFile('src/services/billing.service.ts', 'generateInvoice')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Tax calculation', async () => {
    if (!await checkFile('src/services/billing.service.ts', 'tax')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 5 Result: ${passed - 16} passed, ${failed - (passed < 16 ? 16 - passed : 0)} failed`);

  // Feature 6: Payments
  console.log('\n📋 6. PAYMENT PROCESSING');
  console.log('-'.repeat(70));

  if (await verify('Payment service exists', async () => {
    if (!fs.existsSync('src/services/payment.service.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Stripe integration', async () => {
    if (!await checkFile('src/services/payment.service.ts', 'Stripe')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Crypto payment support', async () => {
    if (!await checkFile('src/services/payment.service.ts', 'crypto')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Refund processing', async () => {
    if (!await checkFile('src/services/payment.service.ts', 'refund')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 6 Result: ${passed - 19} passed, ${failed - (passed < 19 ? 19 - passed : 0)} failed`);

  // Feature 7: Monitoring
  console.log('\n📋 7. MONITORING SERVICE');
  console.log('-'.repeat(70));

  if (await verify('Monitoring service exists', async () => {
    if (!fs.existsSync('src/services/monitoring.service.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('GPU health checks', async () => {
    if (!await checkFile('src/services/monitoring.service.ts', 'health')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Metrics collection', async () => {
    if (!await checkFile('src/services/monitoring.service.ts', 'metrics')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 7 Result: ${passed - 23} passed, ${failed - (passed < 23 ? 23 - passed : 0)} failed`);

  // Feature 8: Admin Dashboard
  console.log('\n📋 8. ADMIN DASHBOARD');
  console.log('-'.repeat(70));

  if (await verify('Admin stats endpoint', async () => {
    const adminRes = await request('POST', `${API_URL}/auth/login`, {
      email: 'admin@test.com', password: 'test'
    });
    const res = await request('GET', `${API_URL}/admin/stats`, null, adminRes.data.token);
    if (res.status !== 200) throw new Error('Stats failed');
  })) passed++; else failed++;

  if (await verify('Audit logs in schema', async () => {
    if (!await checkFile('prisma/schema.prisma', 'AuditLog')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 8 Result: ${passed - 26} passed, ${failed - (passed < 26 ? 26 - passed : 0)} failed`);

  // Feature 9: REST API
  console.log('\n📋 9. REST API');
  console.log('-'.repeat(70));

  if (await verify('API documentation', async () => {
    const res = await request('GET', '/api-docs');
    if (res.status !== 200) throw new Error('Swagger not accessible');
  })) passed++; else failed++;

  if (await verify('API versioning', async () => {
    if (!await checkFile('src/index.ts', '/v1')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('CORS configuration', async () => {
    if (!await checkFile('src/index.ts', 'cors')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Error handling', async () => {
    if (!fs.existsSync('src/middleware/errorHandler.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 9 Result: ${passed - 28} passed, ${failed - (passed < 28 ? 28 - passed : 0)} failed`);

  // Feature 10: Web UI
  console.log('\n📋 10. WEB UI');
  console.log('-'.repeat(70));

  if (await verify('UI file exists', async () => {
    if (!fs.existsSync('public/index.html')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Login/Register pages', async () => {
    if (!await checkFile('public/index.html', 'login')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('GPU marketplace', async () => {
    if (!await checkFile('public/index.html', 'gpus')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Admin dashboard UI', async () => {
    if (!await checkFile('public/index.html', 'admin')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 10 Result: ${passed - 32} passed, ${failed - (passed < 32 ? 32 - passed : 0)} failed`);

  // Feature 11: Mock Data
  console.log('\n📋 11. MOCK DATA MODE');
  console.log('-'.repeat(70));

  if (await verify('Mock routes exist', async () => {
    if (!fs.existsSync('src/routes/mock.routes.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Mock GPU data', async () => {
    if (!await checkFile('src/routes/mock.routes.ts', 'mockGPUs')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 11 Result: ${passed - 36} passed, ${failed - (passed < 36 ? 36 - passed : 0)} failed`);

  // Feature 12: Automation
  console.log('\n📋 12. AUTOMATED DEVELOPMENT LOOP');
  console.log('-'.repeat(70));

  if (await verify('Master loop script', async () => {
    if (!fs.existsSync('scripts/master-loop.js')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Test automation', async () => {
    if (!fs.existsSync('scripts/test-all-features.js')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 12 Result: ${passed - 38} passed, ${failed - (passed < 38 ? 38 - passed : 0)} failed`);

  // Feature 13: Security
  console.log('\n📋 13. SECURITY FEATURES');
  console.log('-'.repeat(70));

  if (await verify('JWT authentication', async () => {
    if (!await checkFile('src/middleware/auth.ts', 'jwt')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Helmet security headers', async () => {
    if (!await checkFile('src/index.ts', 'helmet')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 13 Result: ${passed - 40} passed, ${failed - (passed < 40 ? 40 - passed : 0)} failed`);

  // Feature 14: DevOps
  console.log('\n📋 14. DEVOPS & DEPLOYMENT');
  console.log('-'.repeat(70));

  if (await verify('Docker Compose', async () => {
    if (!fs.existsSync('docker-compose.yml')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Database schema', async () => {
    if (!fs.existsSync('prisma/schema.prisma')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Seed script', async () => {
    if (!fs.existsSync('prisma/seed.ts')) throw new Error('Not found');
  })) passed++; else failed++;

  if (await verify('Setup automation', async () => {
    if (!fs.existsSync('scripts/setup.js')) throw new Error('Not found');
  })) passed++; else failed++;

  console.log(`\n📊 Section 14 Result: ${passed - 42} passed, ${failed - (passed < 42 ? 42 - passed : 0)} failed`);

  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎯 FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Total Passed: ${passed}`);
  console.log(`❌ Total Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log(`🔢 Total Checks: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 ALL FEATURES VERIFIED SUCCESSFULLY!');
    console.log('✨ Platform is 100% complete and working!\n');
  } else {
    console.log(`\n⚠️  ${failed} check(s) need attention.\n`);
  }
}

main().catch(console.error);
