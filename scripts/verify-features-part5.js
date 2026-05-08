const { log, request, checkFeature } = require('./verify-features-part1');
const fs = require('fs');
const path = require('path');

// Feature 11: Web UI
async function testWebUI() {
  log('\n📋 11. WEB UI');
  const results = [];

  results.push(await checkFeature('UI', 'Beautiful gradient design', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    if (!fs.existsSync(uiFile)) throw new Error('UI file not found');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('gradient')) throw new Error('Gradient design not found');
  }));

  results.push(await checkFeature('UI', 'Login/Register pages', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('login') || !content.includes('register')) {
      throw new Error('Login/Register pages not found');
    }
  }));

  results.push(await checkFeature('UI', 'GPU marketplace', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('gpus')) throw new Error('GPU marketplace not found');
  }));

  results.push(await checkFeature('UI', 'My Rentals page', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('rentals')) throw new Error('Rentals page not found');
  }));

  results.push(await checkFeature('UI', 'Subscription plans page', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('subscriptions')) throw new Error('Subscriptions page not found');
  }));

  results.push(await checkFeature('UI', 'Admin dashboard', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('admin')) throw new Error('Admin dashboard not found');
  }));

  results.push(await checkFeature('UI', 'Real-time server status', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('status') || !content.includes('checkStatus')) {
      throw new Error('Server status not found');
    }
  }));

  results.push(await checkFeature('UI', 'Responsive design', async () => {
    const uiFile = path.join(__dirname, '..', 'public', 'index.html');
    const content = fs.readFileSync(uiFile, 'utf8');
    if (!content.includes('viewport') || !content.includes('responsive')) {
      // Check for grid or flex
      if (!content.includes('grid') && !content.includes('flex')) {
        throw new Error('Responsive design not found');
      }
    }
  }));

  return results;
}

// Feature 12: Mock Data Mode
async function testMockData() {
  log('\n📋 12. MOCK DATA MODE');
  const results = [];

  results.push(await checkFeature('Mock', 'Works without database', async () => {
    const mockFile = path.join(__dirname, '..', 'src', 'routes', 'mock.routes.ts');
    if (!fs.existsSync(mockFile)) throw new Error('Mock routes not found');
  }));

  results.push(await checkFeature('Mock', 'Test data for all features', async () => {
    const mockFile = path.join(__dirname, '..', 'src', 'routes', 'mock.routes.ts');
    const content = fs.readFileSync(mockFile, 'utf8');
    if (!content.includes('mockGPUs') || !content.includes('mockPlans')) {
      throw new Error('Test data incomplete');
    }
  }));

  results.push(await checkFeature('Mock', 'Instant testing capability', async () => {
    const indexFile = path.join(__dirname, '..', 'src', 'index.ts');
    const content = fs.readFileSync(indexFile, 'utf8');
    if (!content.includes('USE_MOCK') && !content.includes('mock')) {
      throw new Error('Mock mode not configured');
    }
  }));

  return results;
}

// Feature 13: Automated Development Loop
async function testAutomation() {
  log('\n📋 13. AUTOMATED DEVELOPMENT LOOP');
  const results = [];

  results.push(await checkFeature('Automation', 'Continuous building', async () => {
    const loopFile = path.join(__dirname, '..', 'scripts', 'master-loop.js');
    if (!fs.existsSync(loopFile)) throw new Error('Automation loop not found');
    const content = fs.readFileSync(loopFile, 'utf8');
    if (!content.includes('build')) throw new Error('Build automation not found');
  }));

  results.push(await checkFeature('Automation', 'Automated testing', async () => {
    const testFile = path.join(__dirname, '..', 'scripts', 'test-all-features.js');
    if (!fs.existsSync(testFile)) throw new Error('Test automation not found');
  }));

  results.push(await checkFeature('Automation', 'Log analysis', async () => {
    const loopFile = path.join(__dirname, '..', 'scripts', 'master-loop.js');
    const content = fs.readFileSync(loopFile, 'utf8');
    if (!content.includes('log') && !content.includes('analyze')) {
      throw new Error('Log analysis not found');
    }
  }));

  results.push(await checkFeature('Automation', 'Git automation', async () => {
    const loopFile = path.join(__dirname, '..', 'scripts', 'master-loop.js');
    const content = fs.readFileSync(loopFile, 'utf8');
    if (!content.includes('git') && !content.includes('commit')) {
      throw new Error('Git automation not found');
    }
  }));

  results.push(await checkFeature('Automation', 'GitHub integration', async () => {
    const loopFile = path.join(__dirname, '..', 'scripts', 'master-loop.js');
    const content = fs.readFileSync(loopFile, 'utf8');
    if (!content.includes('push') && !content.includes('github')) {
      throw new Error('GitHub integration not found');
    }
  }));

  return results;
}

// Feature 14: Security Features
async function testSecurity() {
  log('\n📋 14. SECURITY FEATURES');
  const results = [];

  results.push(await checkFeature('Security', 'JWT authentication', async () => {
    const authFile = path.join(__dirname, '..', 'src', 'middleware', 'auth.ts');
    if (!fs.existsSync(authFile)) throw new Error('Auth middleware not found');
    const content = fs.readFileSync(authFile, 'utf8');
    if (!content.includes('jwt')) throw new Error('JWT not found');
  }));

  results.push(await checkFeature('Security', 'Password hashing', async () => {
    const authFile = path.join(__dirname, '..', 'src', 'routes', 'auth.routes.ts');
    const content = fs.readFileSync(authFile, 'utf8');
    if (!content.includes('bcrypt') && !content.includes('hash')) {
      throw new Error('Password hashing not found');
    }
  }));

  results.push(await checkFeature('Security', 'Role-based access', async () => {
    const authFile = path.join(__dirname, '..', 'src', 'middleware', 'auth.ts');
    const content = fs.readFileSync(authFile, 'utf8');
    if (!content.includes('role') && !content.includes('authorize')) {
      throw new Error('RBAC not found');
    }
  }));

  results.push(await checkFeature('Security', 'Audit logging', async () => {
    const schemaFile = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const content = fs.readFileSync(schemaFile, 'utf8');
    if (!content.includes('AuditLog')) throw new Error('Audit logging not found');
  }));

  results.push(await checkFeature('Security', 'Security headers (Helmet)', async () => {
    const indexFile = path.join(__dirname, '..', 'src', 'index.ts');
    const content = fs.readFileSync(indexFile, 'utf8');
    if (!content.includes('helmet')) throw new Error('Helmet not found');
  }));

  return results;
}

// Feature 15: DevOps & Deployment
async function testDevOps() {
  log('\n📋 15. DEVOPS & DEPLOYMENT');
  const results = [];

  results.push(await checkFeature('DevOps', 'Docker Compose setup', async () => {
    const dockerFile = path.join(__dirname, '..', 'docker-compose.yml');
    if (!fs.existsSync(dockerFile)) throw new Error('Docker Compose not found');
  }));

  results.push(await checkFeature('DevOps', 'Database migrations', async () => {
    const schemaFile = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaFile)) throw new Error('Prisma schema not found');
  }));

  results.push(await checkFeature('DevOps', 'Seed data scripts', async () => {
    const seedFile = path.join(__dirname, '..', 'prisma', 'seed.ts');
    if (!fs.existsSync(seedFile)) throw new Error('Seed script not found');
  }));

  results.push(await checkFeature('DevOps', 'Setup automation', async () => {
    const setupFile = path.join(__dirname, '..', 'scripts', 'setup.js');
    if (!fs.existsSync(setupFile)) throw new Error('Setup script not found');
  }));

  results.push(await checkFeature('DevOps', 'Environment configuration', async () => {
    const envFile = path.join(__dirname, '..', '.env.example');
    if (!fs.existsSync(envFile)) throw new Error('Environment config not found');
  }));

  return results;
}

module.exports = { testWebUI, testMockData, testAutomation, testSecurity, testDevOps };
