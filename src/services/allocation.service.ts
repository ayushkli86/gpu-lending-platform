import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export class AllocationService {
  async findAvailableGPU(requirements: {
    minMemory?: number;
    model?: string;
    location?: string;
  }): Promise<any> {
    const gpus = await prisma.gPU.findMany({
      where: {
        status: 'AVAILABLE',
        ...(requirements.minMemory && { memory: { gte: requirements.minMemory } }),
        ...(requirements.model && { model: { contains: requirements.model } }),
        ...(requirements.location && { 
          server: { location: { contains: requirements.location } }
        })
      },
      include: { server: true },
      take: 1
    });

    return gpus[0] || null;
  }

  async allocateGPU(gpuId: string, userId: string): Promise<boolean> {
    try {
      await prisma.gPU.update({
        where: { id: gpuId },
        data: { status: 'RENTED' }
      });

      logger.info(`GPU ${gpuId} allocated to user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to allocate GPU ${gpuId}:`, error);
      return false;
    }
  }

  async releaseGPU(gpuId: string): Promise<boolean> {
    try {
      await prisma.gPU.update({
        where: { id: gpuId },
        data: { status: 'AVAILABLE' }
      });

      logger.info(`GPU ${gpuId} released`);
      return true;
    } catch (error) {
      logger.error(`Failed to release GPU ${gpuId}:`, error);
      return false;
    }
  }

  async getUtilizationStats(): Promise<any> {
    const [total, available, rented, maintenance] = await Promise.all([
      prisma.gPU.count(),
      prisma.gPU.count({ where: { status: 'AVAILABLE' } }),
      prisma.gPU.count({ where: { status: 'RENTED' } }),
      prisma.gPU.count({ where: { status: 'MAINTENANCE' } })
    ]);

    return {
      total,
      available,
      rented,
      maintenance,
      utilizationRate: total > 0 ? (rented / total) * 100 : 0
    };
  }
}

export const allocationService = new AllocationService();
