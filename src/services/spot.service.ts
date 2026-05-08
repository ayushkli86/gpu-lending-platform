import { PrismaClient, SpotRequestStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export class SpotService {
  // Create spot instance request
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

  // Calculate spot discount (65% off)
  calculateDiscount(originalPrice: number): number {
    return originalPrice * 0.35; // 65% discount = pay 35%
  }

  // List user's spot requests
  async listRequests(userId: string) {
    return prisma.spotRequest.findMany({
      where: { userId },
      include: { rental: true },
    });
  }

  // Cancel spot request
  async cancelRequest(requestId: string) {
    return prisma.spotRequest.updateMany({
      where: { id: requestId },
      data: { status: SpotRequestStatus.CANCELLED },
    });
  }
}

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
