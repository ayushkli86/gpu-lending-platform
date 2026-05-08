#!/bin/bash

# Automated Improvement Implementation
# Fixes issues automatically based on test results

set -e

echo "🔧 Starting Automated Improvements"

# Phase 1: Database Setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Database Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if PostgreSQL is running
if ! docker ps | grep -q postgres; then
    echo "Starting PostgreSQL..."
    docker run -d \
        --name gpu-lending-postgres \
        -p 5432:5432 \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=gpu_lending \
        postgres:15
    
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running migrations..."
npx prisma migrate dev --name initial || true

# Seed database
echo "Seeding database..."
npx prisma db seed || true

echo "✅ Database setup complete"

# Phase 2: Install Missing Dependencies
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm install --save-dev \
    jest \
    @types/jest \
    ts-jest \
    supertest \
    @types/supertest

npm install \
    helmet \
    cors \
    compression \
    express-rate-limit \
    winston \
    ioredis \
    bullmq

echo "✅ Dependencies installed"

# Phase 3: Create Test Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: Test Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
EOF

echo "✅ Jest configured"

# Phase 4: Fix TypeScript Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: TypeScript Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

echo "✅ TypeScript configured"

# Phase 5: Update package.json scripts
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Package Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Add test script if missing
npm pkg set scripts.test="jest --coverage"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.lint="eslint src --ext .ts"
npm pkg set scripts.lint:fix="eslint src --ext .ts --fix"

echo "✅ Scripts updated"

echo ""
echo "🎉 Automated improvements complete!"
echo ""
echo "Next: Run ./continuous-improvement.sh to start the test loop"
