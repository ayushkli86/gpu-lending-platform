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
