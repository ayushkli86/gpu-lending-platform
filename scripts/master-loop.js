const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOOP_INTERVAL = 15 * 60 * 1000; // 15 minutes
const LOG_DIR = path.join(__dirname, '..', 'logs');
const MASTER_LOG = path.join(LOG_DIR, 'master-loop.log');

let loopCount = 0;
let serverProcess = null;
let nextRunTime = Date.now() + LOOP_INTERVAL;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(MASTER_LOG, logMessage);
}

function run(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { shell: true, stdio: 'pipe' });
    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data) => { output += data.toString(); });
    proc.stderr?.on('data', (data) => { errorOutput += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(errorOutput || output));
    });

    proc.on('error', reject);
  });
}

function runSync(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

function getTimeRemaining() {
  const remaining = Math.max(0, nextRunTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

async function startServer() {
  return new Promise((resolve) => {
    log('🚀 Starting development server...');
    serverProcess = spawn('npm', ['run', 'dev'], { 
      shell: true,
      stdio: 'pipe',
      detached: false
    });

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on port')) {
        log('✅ Server started successfully');
        resolve(true);
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error')) {
        log(`⚠️ Server error: ${error}`, 'WARN');
      }
    });

    setTimeout(() => resolve(false), 10000);
  });
}

function stopServer() {
  if (serverProcess) {
    log('🛑 Stopping server...');
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch (error) {
      log('⚠️ Error stopping server', 'WARN');
    }
    serverProcess = null;
  }
}

async function runTests() {
  log('🧪 Running API tests...');
  try {
    await run('node', ['scripts/test-api.js']);
    log('✅ Tests passed');
    return true;
  } catch (error) {
    log('❌ Tests failed', 'ERROR');
    return false;
  }
}

async function analyzeLogs() {
  const improvements = [];
  const errorLog = path.join(LOG_DIR, 'error.log');
  
  if (fs.existsSync(errorLog)) {
    const errors = fs.readFileSync(errorLog, 'utf8');
    const lines = errors.split('\n').slice(-50);
    
    const errorPatterns = {
      'ECONNREFUSED': 'Database connection issues',
      'ValidationError': 'Input validation errors',
      'UnauthorizedError': 'Authentication issues',
      'EADDRINUSE': 'Port already in use',
      'TypeError': 'Type errors in code'
    };

    for (const [pattern, description] of Object.entries(errorPatterns)) {
      if (lines.some(line => line.includes(pattern))) {
        improvements.push(description);
      }
    }
  }

  return improvements;
}

async function gitCommit(message) {
  try {
    runSync('git add .');
    const result = runSync(`git commit -m "${message}"`);
    if (result) {
      log(`✅ Committed: ${message}`);
      return true;
    }
  } catch (error) {
    log('⚠️ Nothing to commit', 'WARN');
  }
  return false;
}

async function pushToGitHub() {
  try {
    log('📤 Pushing to GitHub...');
    const result = runSync('git push origin master');
    if (result !== null) {
      log('✅ Pushed to GitHub');
      return true;
    }
  } catch (error) {
    log('⚠️ GitHub push failed - repository may not be set up', 'WARN');
  }
  return false;
}

async function developmentCycle() {
  loopCount++;
  log(`\n${'='.repeat(70)}`);
  log(`🔄 DEVELOPMENT LOOP #${loopCount} STARTED`);
  log(`${'='.repeat(70)}\n`);

  try {
    // Step 1: Build project
    log('🔨 Building project...');
    try {
      await run('npm', ['run', 'build']);
      log('✅ Build successful');
      await gitCommit(`build: successful compilation (loop ${loopCount})`);
    } catch (error) {
      log('❌ Build failed', 'ERROR');
      await gitCommit(`fix: build errors (loop ${loopCount})`);
    }

    // Step 2: Start server
    const serverStarted = await startServer();
    
    if (serverStarted) {
      // Step 3: Run tests
      await new Promise(resolve => setTimeout(resolve, 3000));
      const testsPassed = await runTests();
      
      if (testsPassed) {
        await gitCommit(`test: all tests passing (loop ${loopCount})`);
      }
    }

    // Step 4: Stop server
    stopServer();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Analyze logs
    const improvements = await analyzeLogs();
    if (improvements.length > 0) {
      log(`📝 Improvements identified: ${improvements.length}`);
      improvements.forEach((imp, i) => log(`  ${i + 1}. ${imp}`));
      await gitCommit(`refactor: ${improvements[0]} (loop ${loopCount})`);
    }

    // Step 6: Push to GitHub (every 3 loops)
    if (loopCount % 3 === 0) {
      await pushToGitHub();
    }

    log(`\n✨ Loop #${loopCount} completed successfully`);
    
  } catch (error) {
    log(`❌ Loop #${loopCount} failed: ${error.message}`, 'ERROR');
    stopServer();
  }

  nextRunTime = Date.now() + LOOP_INTERVAL;
  log(`\n⏰ Next loop in ${LOOP_INTERVAL / 60000} minutes`);
  log(`${'='.repeat(70)}\n`);
}

function displayCountdown() {
  process.stdout.write(`\r⏳ Next loop: ${getTimeRemaining()} | Loops: ${loopCount} | Press Ctrl+C to stop `);
}

async function main() {
  log('🚀 GPU LENDING PLATFORM - MASTER AUTOMATION LOOP');
  log(`Loop interval: ${LOOP_INTERVAL / 60000} minutes`);
  log(`Log file: ${MASTER_LOG}\n`);

  // Initial cycle
  await developmentCycle();

  // Recurring cycles
  setInterval(developmentCycle, LOOP_INTERVAL);

  // Countdown display
  setInterval(displayCountdown, 1000);
}

process.on('SIGINT', async () => {
  log('\n\n🛑 Shutting down automation loop...');
  stopServer();
  await gitCommit(`chore: automation stopped at loop ${loopCount}`);
  await pushToGitHub();
  log('👋 Goodbye!');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'ERROR');
  stopServer();
});

main().catch(error => {
  log(`💥 Fatal error: ${error.message}`, 'ERROR');
  stopServer();
  process.exit(1);
});
