import { MIGService, MIG_PROFILES } from '../mig.service';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    gPU: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    mIGInstance: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

describe('MIGService', () => {
  let migService: MIGService;

  beforeEach(() => {
    migService = new MIGService();
  });

  describe('enableMIG', () => {
    it('should enable MIG on a GPU with profile', async () => {
      const result = await migService.enableMIG('gpu1', '1g.10gb');
      expect(result).toBeDefined();
    });
  });

  describe('createInstance', () => {
    it('should create a MIG instance with correct profile', async () => {
      const result = await migService.createInstance('gpu1', '1g.10gb');
      expect(result).toBeDefined();
    });

    it('should have correct pricing for each profile', () => {
      expect(MIG_PROFILES['1g.10gb'].hourlyRate).toBe(0.25);
      expect(MIG_PROFILES['2g.20gb'].hourlyRate).toBe(0.50);
      expect(MIG_PROFILES['3g.40gb'].hourlyRate).toBe(0.75);
      expect(MIG_PROFILES['7g.80gb'].hourlyRate).toBe(1.50);
    });
  });

  describe('listInstances', () => {
    it('should return all MIG instances for a GPU', async () => {
      const result = await migService.listInstances('gpu1');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
