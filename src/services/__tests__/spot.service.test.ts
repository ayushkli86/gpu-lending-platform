import { SpotService } from '../spot.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    spotRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
    },
  })),
  SpotRequestStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    INTERRUPTED: 'INTERRUPTED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

describe('SpotService', () => {
  let spotService: SpotService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    spotService = new SpotService();
    (spotService as any).prisma = mockPrisma;
  });

  describe('createRequest', () => {
    it('should create a spot request with 65% discount', async () => {
      const mockRequest = {
        id: '1',
        userId: 'user1',
        gpuType: 'H100',
        maxPrice: 2.0,
        duration: 24,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.spotRequest.create.mockResolvedValue(mockRequest);

      const result = await spotService.createRequest({
        userId: 'user1',
        gpuType: 'H100',
        maxPrice: 2.0,
        duration: 24,
      });

      expect(result).toEqual(mockRequest);
      expect(mockPrisma.spotRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          gpuType: 'H100',
          maxPrice: 2.0,
          duration: 24,
          status: 'PENDING',
        }),
      });
    });

    it('should calculate 65% discount correctly', () => {
      const originalPrice = 5.0;
      const discount = spotService.calculateDiscount(originalPrice);
      expect(discount).toBe(1.75); // 35% of 5.0
    });
  });

  describe('listRequests', () => {
    it('should return user spot requests', async () => {
      const mockRequests = [
        { id: '1', userId: 'user1', status: 'PENDING' },
        { id: '2', userId: 'user1', status: 'ACTIVE' },
      ];

      mockPrisma.spotRequest.findMany.mockResolvedValue(mockRequests);

      const result = await spotService.listRequests('user1');

      expect(result).toEqual(mockRequests);
      expect(mockPrisma.spotRequest.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: { rental: true },
      });
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending request', async () => {
      const mockRequest = {
        id: '1',
        status: 'CANCELLED',
      };

      mockPrisma.spotRequest.update.mockResolvedValue(mockRequest);

      const result = await spotService.cancelRequest('1');

      expect(result.status).toBe('CANCELLED');
      expect(mockPrisma.spotRequest.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'CANCELLED' },
      });
    });
  });
});
