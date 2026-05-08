const { execSync } = require('child_process');

function run(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

console.log('🔧 Setting up GitHub repository...\n');

// Check if gh CLI is installed
const ghVersion = run('gh --version');
if (!ghVersion) {
  console.log('❌ GitHub CLI (gh) is not installed.');
  console.log('📥 Install it from: https://cli.github.com/');
  console.log('\nAlternatively, create a repository manually:');
  console.log('1. Go to https://github.com/new');
  console.log('2. Create a repository named "gpu-lending-platform"');
  console.log('3. Run: git remote add origin https://github.com/YOUR_USERNAME/gpu-lending-platform.git');
  console.log('4. Run: git push -u origin master\n');
  process.exit(1);
}

console.log('✅ GitHub CLI found\n');

// Check if already logged in
const authStatus = run('gh auth status');
if (!authStatus || authStatus.includes('not logged')) {
  console.log('🔐 Please login to GitHub:');
  execSync('gh auth login', { stdio: 'inherit' });
}

// Create repository
console.log('📦 Creating GitHub repository...');
const createRepo = run('gh repo create gpu-lending-platform --public --source=. --remote=origin --description="Multi-tenant GPU lending platform with comprehensive backend"');

if (createRepo !== null) {
  console.log('✅ Repository created successfully!\n');
  
  // Push code
  console.log('📤 Pushing code to GitHub...');
  run('git push -u origin master');
  
  console.log('\n✨ Setup complete!');
  console.log('🔗 Repository: https://github.com/YOUR_USERNAME/gpu-lending-platform\n');
} else {
  console.log('⚠️ Repository might already exist. Trying to add remote...');
  run('git remote add origin https://github.com/ayushkli86/gpu-lending-platform.git');
  run('git push -u origin master');
}
