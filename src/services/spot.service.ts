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
