import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../services/cache.service';

const router = Router();

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /gpus/servers
router.get('/servers', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const [servers, total] = await Promise.all([
      prisma.gPUServer.findMany({
        skip,
        take: limit,
        include: { gpus: { select: { id: true, model: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gPUServer.count(),
    ]);

    res.json({ servers, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// POST /gpus/servers (admin)
router.post('/servers', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      hostname: z.string().min(1),
      ipAddress: z.string().ip(),
      location: z.string().optional(),
    }).parse(req.body);

    const server = await prisma.gPUServer.create({ data });
    await cache.delPattern('gpus:*');
    res.status(201).json({ server });
  } catch (err) {
    next(err);
  }
});

// GET /gpus
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const { status, model } = z.object({
      status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE']).optional(),
      model: z.string().optional(),
    }).parse(req.query);

    const cacheKey = `gpus:list:${page}:${limit}:${status ?? ''}:${model ?? ''}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const where = {
      ...(status && { status }),
      ...(model && { model: { contains: model, mode: 'insensitive' as const } }),
    };
    const skip = (page - 1) * limit;

    const [gpus, total] = await Promise.all([
      prisma.gPU.findMany({
        where,
        skip,
        take: limit,
        include: {
          server: { select: { name: true, location: true } },
          pricingPlan: { select: { name: true, hourlyRate: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gPU.count({ where }),
    ]);

    const result = { gpus, total, page, limit, pages: Math.ceil(total / limit) };
    await cache.set(cacheKey, result, 30);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /gpus/available
router.get('/available', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const cacheKey = `gpus:available:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const skip = (page - 1) * limit;
    const [gpus, total] = await Promise.all([
      prisma.gPU.findMany({
        where: { status: 'AVAILABLE' },
        skip,
        take: limit,
        include: {
          server: { select: { name: true, location: true } },
          pricingPlan: { select: { name: true, hourlyRate: true } },
        },
      }),
      prisma.gPU.count({ where: { status: 'AVAILABLE' } }),
    ]);

    const result = { gpus, total, page, limit, pages: Math.ceil(total / limit) };
    await cache.set(cacheKey, result, 15);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /gpus/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const gpu = await prisma.gPU.findUnique({
      where: { id: req.params.id },
      include: {
        server: true,
        pricingPlan: true,
        cluster: { select: { id: true, name: true } },
      },
    });
    if (!gpu) throw new AppError('GPU not found', 404);
    res.json({ gpu });
  } catch (err) {
    next(err);
  }
});

// POST /gpus (admin)
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({
      serverId: z.string().uuid(),
      model: z.string().min(1),
      memory: z.number().int().positive(),
      computeCapability: z.string().min(1),
      pcieBusId: z.string().min(1),
      pricingPlanId: z.string().uuid().optional(),
    }).parse(req.body);

    const server = await prisma.gPUServer.findUnique({ where: { id: data.serverId } });
    if (!server) throw new AppError('Server not found', 404);

    if (data.pricingPlanId) {
      const plan = await prisma.pricingPlan.findUnique({ where: { id: data.pricingPlanId } });
      if (!plan || !plan.isActive) throw new AppError('Pricing plan not found or inactive', 404);
    }

    const gpu = await prisma.gPU.create({ data });
    await cache.delPattern('gpus:*');
    res.status(201).json({ gpu });
  } catch (err) {
    next(err);
  }
});

// PATCH /gpus/:id/status (admin)
router.patch('/:id/status', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE']),
    }).parse(req.body);

    const gpu = await prisma.gPU.update({ where: { id: req.params.id }, data: { status } });
    await cache.delPattern('gpus:*');
    res.json({ gpu });
  } catch (err) {
    next(err);
  }
});

// POST /gpus/clusters (admin)
router.post('/clusters', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, gpuIds } = z.object({
      name: z.string().min(1),
      gpuIds: z.array(z.string().uuid()).min(1),
    }).parse(req.body);

    const cluster = await prisma.gPUCluster.create({
      data: { name, gpus: { connect: gpuIds.map((id) => ({ id })) } },
      include: { gpus: true },
    });

    await cache.delPattern('gpus:*');
    res.status(201).json({ cluster });
  } catch (err) {
    next(err);
  }
});

// GET /gpus/pricing-plans (admin)
router.get('/pricing-plans', authenticate, authorize('ADMIN'), async (_req, res, next) => {
  try {
    const plans = await prisma.pricingPlan.findMany({ where: { isActive: true }, orderBy: { hourlyRate: 'asc' } });
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// POST /gpus/pricing-plans (admin)
router.post('/pricing-plans', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      hourlyRate: z.number().positive(),
    }).parse(req.body);

    const plan = await prisma.pricingPlan.create({ data });
    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
});

export default router;
