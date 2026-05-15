import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { billingService } from '../services/billing.service';
import { logger } from '../utils/logger';
import { cache } from '../services/cache.service';

const router = Router();

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// POST /rentals — create rental (atomic, no race condition)
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { gpuId, clusterId, startTime, endTime } = z.object({
      gpuId: z.string().uuid().optional(),
      clusterId: z.string().uuid().optional(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional(),
    }).refine((d) => d.gpuId || d.clusterId, {
      message: 'Either gpuId or clusterId must be provided',
    }).parse(req.body);

    const userId = req.user!.id;

    const rental = await prisma.$transaction(async (tx) => {
      let hourlyRate: number;

      if (gpuId) {
        // Lock the GPU row to prevent concurrent rentals
        const gpu = await tx.gPU.findUnique({ where: { id: gpuId }, include: { pricingPlan: true } });
        if (!gpu) throw new AppError('GPU not found', 404);
        if (gpu.status !== 'AVAILABLE') throw new AppError('GPU is not available', 409);

        hourlyRate = gpu.pricingPlan?.hourlyRate ?? 1.0; // fallback $1/hr

        await tx.gPU.update({ where: { id: gpuId }, data: { status: 'RENTED' } });
      } else {
        // Cluster rental — use average pricing of member GPUs
        const cluster = await tx.gPUCluster.findUnique({
          where: { id: clusterId },
          include: { gpus: { include: { pricingPlan: true } } },
        });
        if (!cluster) throw new AppError('Cluster not found', 404);

        const unavailable = cluster.gpus.filter((g) => g.status !== 'AVAILABLE');
        if (unavailable.length > 0) throw new AppError('One or more GPUs in cluster are not available', 409);

        const rates = cluster.gpus.map((g) => g.pricingPlan?.hourlyRate ?? 1.0);
        hourlyRate = rates.reduce((a, b) => a + b, 0); // sum of all GPU rates

        await tx.gPU.updateMany({
          where: { clusterId },
          data: { status: 'RENTED' },
        });
      }

      const newRental = await tx.rental.create({
        data: {
          userId,
          gpuId,
          clusterId,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          hourlyRate,
          status: 'ACTIVE',
        },
        include: { gpu: true, cluster: true },
      });

      await tx.usageEvent.create({
        data: { rentalId: newRental.id, eventType: 'rental_start', timestamp: new Date(startTime) },
      });

      return newRental;
    });

    await cache.delPattern('gpus:*');
    logger.info(`Rental ${rental.id} created by user ${userId} at $${rental.hourlyRate}/hr`);
    res.status(201).json({ rental });
  } catch (err) {
    next(err);
  }
});

// GET /rentals/my-rentals
router.get('/my-rentals', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const userId = req.user!.id;
    const skip = (page - 1) * limit;

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          gpu: { include: { server: { select: { name: true, location: true } } } },
          cluster: { include: { gpus: { select: { id: true, model: true } } } },
          invoices: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rental.count({ where: { userId } }),
    ]);

    res.json({ rentals, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /rentals/:id
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rental = await prisma.rental.findUnique({
      where: { id: req.params.id },
      include: {
        gpu: { include: { server: true } },
        cluster: { include: { gpus: true } },
        usageEvents: { orderBy: { timestamp: 'desc' }, take: 50 },
        invoices: true,
      },
    });

    if (!rental) throw new AppError('Rental not found', 404);
    if (rental.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    res.json({ rental });
  } catch (err) {
    next(err);
  }
});

// POST /rentals/:id/end — end rental and auto-generate invoice
router.post('/:id/end', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const endedRental = await prisma.$transaction(async (tx) => {
      const existing = await tx.rental.findUnique({ where: { id } });
      if (!existing) throw new AppError('Rental not found', 404);
      if (existing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Access denied', 403);
      }
      if (!['ACTIVE', 'PENDING'].includes(existing.status)) {
        throw new AppError('Rental cannot be ended', 400);
      }

      const now = new Date();
      const updated = await tx.rental.update({
        where: { id },
        data: { status: 'COMPLETED', actualEndTime: now },
      });

      if (existing.gpuId) {
        await tx.gPU.update({ where: { id: existing.gpuId }, data: { status: 'AVAILABLE' } });
      } else if (existing.clusterId) {
        await tx.gPU.updateMany({ where: { clusterId: existing.clusterId }, data: { status: 'AVAILABLE' } });
      }

      await tx.usageEvent.create({
        data: { rentalId: id, eventType: 'rental_end', timestamp: now },
      });

      return updated;
    });

    // Generate invoice outside transaction (non-critical path)
    let invoice = null;
    try {
      invoice = await billingService.generateRentalInvoice(id);
    } catch (err) {
      logger.error(`Failed to generate invoice for rental ${id}`, { err });
    }

    await cache.delPattern('gpus:*');
    logger.info(`Rental ${id} ended`);
    res.json({ rental: endedRental, invoice });
  } catch (err) {
    next(err);
  }
});

// POST /rentals/:id/extend
router.post('/:id/extend', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { endTime } = z.object({ endTime: z.string().datetime() }).parse(req.body);
    const rental = await prisma.rental.findUnique({ where: { id: req.params.id } });

    if (!rental) throw new AppError('Rental not found', 404);
    if (rental.userId !== req.user!.id) throw new AppError('Access denied', 403);
    if (rental.status !== 'ACTIVE') throw new AppError('Only active rentals can be extended', 400);

    const newEnd = new Date(endTime);
    if (rental.endTime && newEnd <= rental.endTime) {
      throw new AppError('New end time must be after current end time', 400);
    }

    const updated = await prisma.rental.update({
      where: { id: req.params.id },
      data: { endTime: newEnd },
    });

    logger.info(`Rental ${req.params.id} extended to ${endTime}`);
    res.json({ rental: updated });
  } catch (err) {
    next(err);
  }
});

// GET /rentals (admin — all rentals)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const { status } = z.object({
      status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    }).parse(req.query);

    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, name: true } },
          gpu: { select: { id: true, model: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rental.count({ where }),
    ]);

    res.json({ rentals, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
