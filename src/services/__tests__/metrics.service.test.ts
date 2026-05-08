import { MetricsService } from '../metrics.service';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    gPUMetrics: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
  });

  describe('storeMetrics', () => {
    it('should store GPU metrics', async () => {
      const mockMetrics = {
        id: 'metric1',
        gpuId: 'gpu1',
        temperature: 75,
        utilization: 85,
        memoryUsed: 40,
        memoryTotal: 80,
        powerDraw: 300,
      };

      const result = await metricsService.storeMetrics({
        gpuId: 'gpu1',
        temperature: 75,
        utilization: 85,
        memoryUsed: 40,
        memoryTotal: 80,
        powerDraw: 300,
      });

      expect(result).toBeDefined();
    });
  });

  describe('getLatestMetrics', () => {
    it('should return latest metrics for a GPU', async () => {
      const result = await metricsService.getLatestMetrics('gpu1');
      expect(result).toBeDefined();
    });
  });

  describe('checkAlerts', () => {
    it('should check alerts for a GPU', async () => {
      const alerts = await metricsService.checkAlerts('gpu1');
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});
