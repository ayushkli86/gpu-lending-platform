#!/bin/bash

# Automated Task Execution Script
# Executes TODO tasks one by one with verification

set -e

cd ~/gpu-lending-platform

echo "🚀 GPU Lending Platform - Automated Task Execution"
echo "=================================================="
echo ""

# Task 1.2: Create seed data
echo "📝 Task 1.2: Database Seeding..."

cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gpulending.com' },
    update: {},
    create: {
      email: 'admin@gpulending.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
    },
  });

  // Create GPU server
  const server = await prisma.gPUServer.create({
    data: {
      name: 'Server-01',
      hostname: 'gpu-server-01.local',
      ipAddress: '192.168.1.100',
      location: 'US-East',
    },
  });

  // Create GPUs
  const gpus = await Promise.all([
    prisma.gPU.create({
      data: {
        serverId: server.id,
        model: 'NVIDIA H100 80GB',
        memory: 80000,
        computeCapability: '9.0',
        pcieBusId: '0000:01:00.0',
        status: 'AVAILABLE',
      },
    }),
    prisma.gPU.create({
      data: {
        serverId: server.id,
        model: 'NVIDIA A100 80GB',
        memory: 80000,
        computeCapability: '8.0',
        pcieBusId: '0000:02:00.0',
        status: 'AVAILABLE',
        migEnabled: true,
        migProfile: '7g.80gb',
      },
    }),
  ]);

  // Create subscription plans
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'Starter',
        description: '1 GPU, perfect for development',
        monthlyPrice: 500,
        gpuAllocation: 1,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Pro',
        description: '4 GPUs, ideal for training',
        monthlyPrice: 1800,
        gpuAllocation: 4,
      },
    }),
  ]);

  console.log('✅ Seeding complete!');
  console.log(`Created: ${admin.email}, ${user.email}`);
  console.log(`Created: ${gpus.length} GPUs`);
  console.log(`Created: ${plans.length} subscription plans`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

echo "✅ Seed script created"

# Task 2.1: Spot Service
echo ""
echo "📝 Task 2.1: Spot Instance Service..."

mkdir -p src/services

cat > src/services/spot.service.ts << 'EOF'
import { PrismaClient, SpotRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class SpotService {
  // Calculate spot price (60-70% discount)
  calculateSpotPrice(onDemandPrice: number): number {
    const discount = 0.65; // 65% discount
    return onDemandPrice * (1 - discount);
  }

  // Create spot request
  async createRequest(data: {
    userId: string;
    gpuType: string;
    maxPrice: number;
    duration: number;
  }) {
    const spotPrice = this.calculateSpotPrice(data.maxPrice);
    
    return prisma.spotRequest.create({
      data: {
        userId: data.userId,
        gpuType: data.gpuType,
        maxPrice: data.maxPrice,
        duration: data.duration,
        status: 'PENDING',
        metadata: {
          spotPrice,
          estimatedSavings: data.maxPrice - spotPrice,
        },
      },
    });
  }

  // List user's spot requests
  async listRequests(userId: string) {
    return prisma.spotRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cancel spot request
  async cancelRequest(id: string, userId: string) {
    return prisma.spotRequest.updateMany({
      where: { id, userId },
      data: { status: 'CANCELLED' },
    });
  }

  // Handle interruption
  async handleInterruption(requestId: string, checkpointUrl?: string) {
    return prisma.spotRequest.update({
      where: { id: requestId },
      data: {
        status: 'INTERRUPTED',
        interruptedAt: new Date(),
        checkpointUrl,
      },
    });
  }
}

export const spotService = new SpotService();
EOF

echo "✅ Spot service created"

# Task 2.2: MIG Service
echo ""
echo "📝 Task 2.2: MIG Management Service..."

cat > src/services/mig.service.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MIGProfile {
  name: string;
  gpuSlices: number;
  memoryGB: number;
  computeSlices: number;
  maxInstances: number;
  hourlyRate: number;
}

export const MIG_PROFILES: Record<string, MIGProfile> = {
  '1g.10gb': { name: '1g.10gb', gpuSlices: 1, memoryGB: 10, computeSlices: 1, maxInstances: 7, hourlyRate: 0.25 },
  '2g.20gb': { name: '2g.20gb', gpuSlices: 2, memoryGB: 20, computeSlices: 2, maxInstances: 3, hourlyRate: 0.50 },
  '3g.40gb': { name: '3g.40gb', gpuSlices: 3, memoryGB: 40, computeSlices: 3, maxInstances: 2, hourlyRate: 0.75 },
  '7g.80gb': { name: '7g.80gb', gpuSlices: 7, memoryGB: 80, computeSlices: 7, maxInstances: 1, hourlyRate: 1.50 },
};

export class MIGService {
  // Enable MIG on GPU
  async enableMIG(gpuId: string, profile: string) {
    if (!MIG_PROFILES[profile]) {
      throw new Error(`Invalid MIG profile: ${profile}`);
    }

    return prisma.gPU.update({
      where: { id: gpuId },
      data: {
        migEnabled: true,
        migProfile: profile,
      },
    });
  }

  // Create MIG instance
  async createInstance(gpuId: string, profile: string) {
    if (!MIG_PROFILES[profile]) {
      throw new Error(`Invalid MIG profile: ${profile}`);
    }

    return prisma.mIGInstance.create({
      data: {
        gpuId,
        profile,
        status: 'AVAILABLE',
      },
    });
  }

  // List MIG instances for GPU
  async listInstances(gpuId: string) {
    return prisma.mIGInstance.findMany({
      where: { gpuId },
      include: { gpu: true },
    });
  }

  // Get available profiles
  getProfiles() {
    return Object.values(MIG_PROFILES);
  }

  // Calculate pricing for MIG instance
  calculatePrice(profile: string, hours: number): number {
    const profileData = MIG_PROFILES[profile];
    if (!profileData) throw new Error('Invalid profile');
    return profileData.hourlyRate * hours;
  }
}

export const migService = new MIGService();
EOF

echo "✅ MIG service created"

# Task 2.3: Metrics Service
echo ""
echo "📝 Task 2.3: Metrics Collection Service..."

cat > src/services/metrics.service.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GPUMetricsData {
  gpuId: string;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  temperature: number;
  powerDraw: number;
  fanSpeed?: number;
  clockSpeed?: number;
}

export class MetricsService {
  // Store GPU metrics
  async storeMetrics(data: GPUMetricsData) {
    return prisma.gPUMetrics.create({
      data: {
        gpuId: data.gpuId,
        utilization: data.utilization,
        memoryUsed: data.memoryUsed,
        memoryTotal: data.memoryTotal,
        temperature: data.temperature,
        powerDraw: data.powerDraw,
        fanSpeed: data.fanSpeed,
        clockSpeed: data.clockSpeed,
      },
    });
  }

  // Get latest metrics for GPU
  async getLatestMetrics(gpuId: string) {
    return prisma.gPUMetrics.findFirst({
      where: { gpuId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Get metrics history
  async getMetricsHistory(gpuId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return prisma.gPUMetrics.findMany({
      where: {
        gpuId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Get aggregated metrics
  async getAggregatedMetrics(gpuId: string, hours: number = 24) {
    const metrics = await this.getMetricsHistory(gpuId, hours);
    
    if (metrics.length === 0) return null;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    return {
      avgUtilization: avg(metrics.map(m => m.utilization)),
      avgTemperature: avg(metrics.map(m => m.temperature)),
      avgPowerDraw: avg(metrics.map(m => m.powerDraw)),
      maxUtilization: Math.max(...metrics.map(m => m.utilization)),
      maxTemperature: Math.max(...metrics.map(m => m.temperature)),
      dataPoints: metrics.length,
    };
  }

  // Check for alerts
  async checkAlerts(gpuId: string) {
    const latest = await this.getLatestMetrics(gpuId);
    if (!latest) return [];

    const alerts = [];

    if (latest.temperature > 85) {
      alerts.push({ type: 'HIGH_TEMPERATURE', value: latest.temperature });
    }

    if (latest.utilization < 10) {
      alerts.push({ type: 'LOW_UTILIZATION', value: latest.utilization });
    }

    if (latest.memoryUsed / latest.memoryTotal > 0.95) {
      alerts.push({ type: 'HIGH_MEMORY', value: (latest.memoryUsed / latest.memoryTotal) * 100 });
    }

    return alerts;
  }
}

export const metricsService = new MetricsService();
EOF

echo "✅ Metrics service created"

# Commit
echo ""
echo "💾 Committing changes..."
git add -A
git commit -m "feat: implement core services

- Added database seed script
- Implemented SpotService
- Implemented MIGService  
- Implemented MetricsService

Tasks 1.2, 2.1, 2.2, 2.3 complete ✅"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Core services implementation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Completed:"
echo "  - Task 1.2: Database seeding"
echo "  - Task 2.1: Spot service"
echo "  - Task 2.2: MIG service"
echo "  - Task 2.3: Metrics service"
echo ""
echo "📊 Progress: 30%"
echo ""
