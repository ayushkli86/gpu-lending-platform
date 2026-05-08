const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'continuous-run.log');
let iteration = 0;

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

function run(cmd) {
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

async function cycle() {
  iteration++;
  log(`\n${'='.repeat(60)}`);
  log(`🔄 ITERATION ${iteration} STARTED`);
  log('='.repeat(60));

  // Build
  log('🔨 Building...');
  const build = run('npm run build');
  if (build.success) {
    log('✅ Build successful');
    run('git add . && git commit -m "build: successful compilation" 2>nul');
  } else {
    log('❌ Build failed');
  }

  // Commit and push
  if (iteration % 3 === 0) {
    log('📤 Pushing to GitHub...');
    const push = run('git push origin master 2>nul');
    if (push.success) log('✅ Pushed to GitHub');
  }

  log(`✨ Iteration ${iteration} complete\n`);
}

async function main() {
  log('🚀 CONTINUOUS DEVELOPMENT LOOP STARTED');
  log('Running every 10 minutes. Press Ctrl+C to stop.\n');

  // Run immediately
  await cycle();

  // Then every 10 minutes
  setInterval(cycle, 10 * 60 * 1000);
}

process.on('SIGINT', () => {
  log('\n🛑 Stopping...');
  run(`git add . && git commit -m "chore: stopped at iteration ${iteration}" 2>nul`);
  run('git push origin master 2>nul');
  process.exit(0);
});

main();
