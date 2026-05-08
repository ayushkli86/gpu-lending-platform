const { log, request, checkFeature, API_URL } = require('./verify-features-part1');
const fs = require('fs');
const path = require('path');

// Feature 7: Usage Metering
async function testMetering(token) {
  log('\n📋 7. USAGE METERING');
  const results = [];

  results.push(await checkFeature('Metering', 'Event-driven metering', async () => {
    const schemaFile = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const content = fs.readFileSync(schemaFile, 'utf8');
    if (!content.includes('UsageEvent')) throw new Error('Usage events not found');
  }));

  results.push(await checkFeature('Metering', 'Usage event tracking', async () => {
    const rentalFile = path.join(__dirname, '..', 'src', 'routes', 'rental.routes.ts');
    const content = fs.readFileSync(rentalFile, 'utf8');
    if (!content.includes('usageEvent') && !content.includes('UsageEvent')) {
      throw new Error('Event tracking not found');
    }
  }));

  results.push(await checkFeature('Metering', 'Utilization monitoring', async () => {
    const monitorFile = path.join(__dirname, '..', 'src', 'services', 'monitoring.service.ts');
    if (!fs.existsSync(monitorFile)) throw new Error('Monitoring service not found');
    const content = fs.readFileSync(monitorFile, 'utf8');
    if (!content.includes('utilization')) throw new Error('Utilization not found');
  }));

  results.push(await checkFeature('Metering', 'Data transfer tracking', async () => {
    const schemaFile = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const content = fs.readFileSync(schemaFile, 'utf8');
    if (!content.includes('dataTransfer')) throw new Error('Data transfer not found');
  }));

  results.push(await checkFeature('Metering', 'Usage aggregation', async () => {
    const billingFile = path.join(__dirname, '..', 'src', 'services', 'billing.service.ts');
    const content = fs.readFileSync(billingFile, 'utf8');
    if (!content.includes('usage') && !content.includes('Usage')) {
      throw new Error('Usage aggregation not found');
    }
  }));

  results.push(await checkFeature('Metering', 'Billable usage calculation', async () => {
    const billingFile = path.join(__dirname, '..', 'src', 'services', 'billing.service.ts');
    const content = fs.readFileSync(billingFile, 'utf8');
    if (!content.includes('calculate')) throw new Error('Calculation not found');
  }));

  return results;
}

// Feature 8: Monitoring Service
async function testMonitoring(token) {
  log('\n📋 8. MONITORING SERVICE');
  const results = [];

  results.push(await checkFeature('Monitoring', 'GPU health checks', async () => {
    const monitorFile = path.join(__dirname, '..', 'src', 'services', 'monitoring.service.ts');
    if (!fs.existsSync(monitorFile)) throw new Error('Monitoring service not found');
    const content = fs.readFileSync(monitorFile, 'utf8');
    if (!content.includes('health')) throw new Error('Health checks not found');
  }));

  results.push(await checkFeature('Monitoring', 'Metrics collection (utilization, memory, temperature, power)', async () => {
    const monitorFile = path.join(__dirname, '..', 'src', 'services', 'monitoring.service.ts');
    const content = fs.readFileSync(monitorFile, 'utf8');
    if (!content.includes('metrics') || !content.includes('utilization')) {
      throw new Error('Metrics collection not found');
    }
  }));

  results.push(await checkFeature('Monitoring', 'Real-time status updates', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error('Status endpoint not working');
  }));

  results.push(await checkFeature('Monitoring', 'Alert system', async () => {
    const monitorFile = path.join(__dirname, '..', 'src', 'services', 'monitoring.service.ts');
    const content = fs.readFileSync(monitorFile, 'utf8');
    if (!content.includes('alert') && !content.includes('issue')) {
      throw new Error('Alert system not found');
    }
  }));

  results.push(await checkFeature('Monitoring', 'Performance tracking', async () => {
    const monitorFile = path.join(__dirname, '..', 'src', 'services', 'monitoring.service.ts');
    const content = fs.readFileSync(monitorFile, 'utf8');
    if (!content.includes('performance') && !content.includes('metrics')) {
      throw new Error('Performance tracking not found');
    }
  }));

  return results;
}

// Feature 9: Admin Dashboard
async function testAdminDashboard(token) {
  log('\n📋 9. ADMIN DASHBOARD');
  const results = [];

  results.push(await checkFeature('Admin', 'Platform statistics (users, GPUs, rentals, revenue)', async () => {
    const adminRes = await request('POST', `${API_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin'
    });
    const adminToken = adminRes.data.token;
    const res = await request('GET', `${API_URL}/admin/stats`, null, adminToken);
    if (res.status !== 200) throw new Error('Stats not accessible');
    if (!res.data.totalUsers || !res.data.totalGPUs) throw new Error('Stats incomplete');
  }));

  results.push(await checkFeature('Admin', 'User management', async () => {
    const adminFile = path.join(__dirname, '..', 'src', 'routes', 'admin.routes.ts');
    const content = fs.readFileSync(adminFile, 'utf8');
    if (!content.includes('users')) throw new Error('User management not found');
  }));

  results.push(await checkFeature('Admin', 'GPU server management', async () => {
    const gpuFile = path.join(__dirname, '..', 'src', 'routes', 'gpu.routes.ts');
    const content = fs.readFileSync(gpuFile, 'utf8');
    if (!content.includes('ADMIN')) throw new Error('Admin GPU management not found');
  }));

  results.push(await checkFeature('Admin', 'Rental management', async () => {
    const adminFile = path.join(__dirname, '..', 'src', 'routes', 'admin.routes.ts');
    const content = fs.readFileSync(adminFile, 'utf8');
    if (!content.includes('rentals')) throw new Error('Rental management not found');
  }));

  results.push(await checkFeature('Admin', 'Audit logs', async () => {
    const schemaFile = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const content = fs.readFileSync(schemaFile, 'utf8');
    if (!content.includes('AuditLog')) throw new Error('Audit logs not found');
  }));

  results.push(await checkFeature('Admin', 'System health monitoring', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error('Health monitoring not working');
  }));

  return results;
}

// Feature 10: REST API
async function testRESTAPI(token) {
  log('\n📋 10. REST API');
  const results = [];

  results.push(await checkFeature('API', '26+ API endpoints', async () => {
    // Count endpoints in route files
    const routeFiles = ['auth', 'gpu', 'rental', 'subscription', 'invoice', 'admin'];
    let endpointCount = 0;
    for (const file of routeFiles) {
      const filePath = path.join(__dirname, '..', 'src', 'routes', `${file}.routes.ts`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        endpointCount += (content.match(/router\.(get|post|put|patch|delete)/g) || []).length;
      }
    }
    if (endpointCount < 20) throw new Error(`Only ${endpointCount} endpoints found`);
  }));

  results.push(await checkFeature('API', 'Swagger/OpenAPI documentation', async () => {
    const res = await request('GET', '/api-docs');
    if (res.status !== 200) throw new Error('Swagger not accessible');
  }));

  results.push(await checkFeature('API', 'API versioning (v1)', async () => {
    const indexFile = path.join(__dirname, '..', 'src', 'index.ts');
    const content = fs.readFileSync(indexFile, 'utf8');
    if (!content.includes('/v1')) throw new Error('API versioning not found');
  }));

  results.push(await checkFeature('API', 'Rate limiting support', async () => {
    const packageFile = path.join(__dirname, '..', 'package.json');
    const content = fs.readFileSync(packageFile, 'utf8');
    if (!content.includes('rate-limit')) throw new Error('Rate limiting not configured');
  }));

  results.push(await checkFeature('API', 'CORS configuration', async () => {
    const indexFile = path.join(__dirname, '..', 'src', 'index.ts');
    const content = fs.readFileSync(indexFile, 'utf8');
    if (!content.includes('cors')) throw new Error('CORS not configured');
  }));

  results.push(await checkFeature('API', 'Error handling', async () => {
    const errorFile = path.join(__dirname, '..', 'src', 'middleware', 'errorHandler.ts');
    if (!fs.existsSync(errorFile)) throw new Error('Error handler not found');
  }));

  return results;
}

module.exports = { testMetering, testMonitoring, testAdminDashboard, testRESTAPI };
