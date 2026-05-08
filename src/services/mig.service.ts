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
