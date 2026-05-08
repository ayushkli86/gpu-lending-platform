const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(message);
  console.log('='.repeat(60));
}

function run(command, description) {
  log(description);
  try {
    execSync(command, { stdio: 'inherit', shell: true });
    console.log('✅ Success\n');
    return true;
  } catch (error) {
    console.log('❌ Failed\n');
    return false;
  }
}

async function setup() {
  log('🚀 GPU Lending Platform - Setup Script');

  // Check if .env exists
  if (!fs.existsSync('.env')) {
    log('Creating .env file from .env.example');
    fs.copyFileSync('.env.example', '.env');
  }

  // Install dependencies
  if (!run('npm install --legacy-peer-deps', '📦 Installing dependencies...')) {
    log('⚠️ Dependency installation had issues, continuing...');
  }

  // Generate Prisma client
  run('npx prisma generate', '🔧 Generating Prisma client...');

  // Start Docker containers
  run('docker-compose up -d', '🐳 Starting Docker containers...');

  // Wait for database
  log('⏳ Waiting for database to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Run migrations
  run('npx prisma migrate dev --name init', '🗄️ Running database migrations...');

  log('✨ Setup complete! You can now run:');
  console.log('  npm run dev          - Start development server');
  console.log('  npm run dev:loop     - Start automated development loop');
  console.log('  npm run prisma:studio - Open Prisma Studio\n');
}

setup().catch(console.error);
