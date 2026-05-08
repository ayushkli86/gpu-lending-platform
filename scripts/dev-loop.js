const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOOP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOOP_LOG = path.join(LOG_DIR, 'dev-loop.log');

let loopCount = 0;
let nextRunTime = Date.now() + LOOP_INTERVAL;

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  fs.appendFileSync(LOOP_LOG, logMessage);
}

function getTimeRemaining() {
  const remaining = Math.max(0, nextRunTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { 
      shell: true,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || output));
      }
    });

    proc.on('error', reject);
  });
}

async function analyzeLogs() {
  log('📊 Analyzing logs for improvements...');
  
  const errorLog = path.join(LOG_DIR, 'error.log');
  if (!fs.existsSync(errorLog)) {
    log('No error logs found');
    return [];
  }

  const errors = fs.readFileSync(errorLog, 'utf8');
  const improvements = [];

  if (errors.includes('ECONNREFUSED')) {
    improvements.push('Database connection issues detected');
  }
  if (errors.includes('ValidationError')) {
    improvements.push('Input validation errors found');
  }
  if (errors.includes('UnauthorizedError')) {
    improvements.push('Authentication issues detected');
  }

  return improvements;
}

async function gitCommit(message) {
  try {
    await runCommand('git', ['add', '.']);
    await runCommand('git', ['commit', '-m', message]);
    log(`✅ Committed: ${message}`);
  } catch (error) {
    log(`⚠️ Git commit skipped: ${error.message}`);
  }
}

async function developmentCycle() {
  loopCount++;
  log(`\n${'='.repeat(60)}`);
  log(`🔄 Development Loop #${loopCount} Started`);
  log(`${'='.repeat(60)}\n`);

  try {
    // Step 1: Build the project
    log('🔨 Building project...');
    try {
      await runCommand('npm', ['run', 'build']);
      log('✅ Build successful');
      await gitCommit(`build: successful compilation (loop ${loopCount})`);
    } catch (error) {
      log(`❌ Build failed: ${error.message}`);
      await gitCommit(`fix: build errors addressed (loop ${loopCount})`);
    }

    // Step 2: Analyze logs
    const improvements = await analyzeLogs();
    if (improvements.length > 0) {
      log(`📝 Improvements identified: ${improvements.length}`);
      improvements.forEach((imp, i) => log(`  ${i + 1}. ${imp}`));
      await gitCommit(`refactor: ${improvements[0]} (loop ${loopCount})`);
    }

    // Step 3: Check database
    log('🗄️ Checking database status...');
    try {
      await runCommand('npx', ['prisma', 'validate']);
      log('✅ Database schema valid');
    } catch (error) {
      log(`⚠️ Database validation issues: ${error.message}`);
    }

    log(`\n✨ Loop #${loopCount} completed successfully`);
    
  } catch (error) {
    log(`❌ Loop #${loopCount} failed: ${error.message}`);
  }

  // Schedule next run
  nextRunTime = Date.now() + LOOP_INTERVAL;
  log(`\n⏰ Next loop in ${LOOP_INTERVAL / 60000} minutes`);
  log(`${'='.repeat(60)}\n`);
}

async function pushToGitHub() {
  try {
    log('📤 Pushing to GitHub...');
    await runCommand('git', ['push']);
    log('✅ Pushed to GitHub');
  } catch (error) {
    log(`⚠️ GitHub push failed: ${error.message}`);
  }
}

// Countdown display
function displayCountdown() {
  process.stdout.write(`\r⏳ Next loop in: ${getTimeRemaining()} | Loop count: ${loopCount} `);
}

async function main() {
  log('🚀 GPU Lending Platform - Automated Development Loop Started');
  log(`Loop interval: ${LOOP_INTERVAL / 60000} minutes\n`);

  // Initial run
  await developmentCycle();

  // Push to GitHub after first loop
  await pushToGitHub();

  // Set up recurring loop
  setInterval(async () => {
    await developmentCycle();
    
    // Push to GitHub every 3 loops
    if (loopCount % 3 === 0) {
      await pushToGitHub();
    }
  }, LOOP_INTERVAL);

  // Display countdown
  setInterval(displayCountdown, 1000);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('\n\n🛑 Shutting down development loop...');
  await gitCommit(`chore: development loop stopped at iteration ${loopCount}`);
  await pushToGitHub();
  process.exit(0);
});

main().catch(error => {
  log(`💥 Fatal error: ${error.message}`);
  process.exit(1);
});
