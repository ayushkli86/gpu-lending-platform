import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gpulending.com' },
    update: {},
    create: {
      email: 'admin@gpulending.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin user created');

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER'
    }
  });
  console.log('✅ Test user created');

  // Create GPU servers
  const server1 = await prisma.gPUServer.create({
    data: {
      name: 'GPU Server 1',
      hostname: 'gpu-server-01',
      ipAddress: '192.168.1.100',
      location: 'US-East'
    }
  });

  const server2 = await prisma.gPUServer.create({
    data: {
      name: 'GPU Server 2',
      hostname: 'gpu-server-02',
      ipAddress: '192.168.1.101',
      location: 'US-West'
    }
  });
  console.log('✅ GPU servers created');

  // Create GPUs
  const gpuModels = ['NVIDIA A100', 'NVIDIA H100', 'NVIDIA RTX 4090', 'NVIDIA V100'];
  const gpus = [];

  for (let i = 0; i < 8; i++) {
    const gpu = await prisma.gPU.create({
      data: {
        serverId: i < 4 ? server1.id : server2.id,
        model: gpuModels[i % gpuModels.length],
        memory: [40960, 80960, 24576, 32768][i % 4],
        computeCapability: ['8.0', '9.0', '8.9', '7.0'][i % 4],
        pcieBusId: `0000:${(i + 1).toString(16).padStart(2, '0')}:00.0`,
        status: i < 6 ? 'AVAILABLE' : 'RENTED'
      }
    });
    gpus.push(gpu);
  }
  console.log('✅ GPUs created');

  // Create subscription plans
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'Starter',
        description: 'Perfect for small projects',
        monthlyPrice: 99.99,
        gpuAllocation: 1
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        description: 'For growing teams',
        monthlyPrice: 299.99,
        gpuAllocation: 3
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        description: 'Unlimited power',
        monthlyPrice: 999.99,
        gpuAllocation: 10
      }
    })
  ]);
  console.log('✅ Subscription plans created');

  // Create pricing plans
  await prisma.pricingPlan.createMany({
    data: [
      { name: 'On-Demand A100', hourlyRate: 2.50, isActive: true },
      { name: 'On-Demand H100', hourlyRate: 4.00, isActive: true },
      { name: 'On-Demand RTX 4090', hourlyRate: 1.50, isActive: true }
    ]
  });
  console.log('✅ Pricing plans created');

  console.log('\n🎉 Seeding completed!');
  console.log('\nTest credentials:');
  console.log('  Admin: admin@gpulending.com / admin123');
  console.log('  User:  user@example.com / user123\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
