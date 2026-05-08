import { SpotRequestStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export class SpotService {
  // Calculate spot price (65% discount)
  calculateSpotPrice(onDemandPrice: number): number {
    const discount = 0.65;
    return onDemandPrice * (1 - discount);
  }

  // Create spot request
  async createRequest(data: {
    userId: string;
    gpuType: string;
    maxPrice: number;
    duration: number;
  }) {
    return prisma.spotRequest.create({
      data: {
        userId: data.userId,
        gpuType: data.gpuType,
        maxPrice: data.maxPrice,
        duration: data.duration,
        status: SpotRequestStatus.PENDING,
      },
    });
  }

  // List user's spot requests
  async listRequests(userId: string) {
    return prisma.spotRequest.findMany({
      where: { userId },
      include: { rental: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cancel spot request
  async cancelRequest(id: string, userId: string) {
    return prisma.spotRequest.updateMany({
      where: { id, userId },
      data: { status: SpotRequestStatus.CANCELLED },
    });
  }

  // Handle interruption
  async handleInterruption(requestId: string, checkpointUrl?: string) {
    return prisma.spotRequest.update({
      where: { id: requestId },
      data: {
        status: SpotRequestStatus.INTERRUPTED,
        interruptedAt: new Date(),
        checkpointUrl,
      },
    });
  }
}

export const spotService = new SpotService();
