import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

const createRentalSchema = z.object({
  gpuId: z.string().uuid().optional(),
  clusterId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  hourlyRate: z.number().positive()
}).refine(data => data.gpuId || data.clusterId, {
  message: 'Either gpuId or clusterId must be provided'
});

// Create rental request
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createRentalSchema.parse(req.body);
    const userId = req.user!.id;

    // Check GPU availability
    if (data.gpuId) {
      const gpu = await prisma.gPU.findUnique({ where: { id: data.gpuId } });
      if (!gpu || gpu.status !== 'AVAILABLE') {
        throw new AppError('GPU not available', 400);
      }
    }

    const rental = await prisma.rental.create({
      data: {
        userId,
        gpuId: data.gpuId,
        clusterId: data.clusterId,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        hourlyRate: data.hourlyRate,
        status: 'PENDING'
      },
      include: {
        gpu: true,
        cluster: true
      }
    });

    // Update GPU status
    if (data.gpuId) {
      await prisma.gPU.update({
        where: { id: data.gpuId },
        data: { status: 'RENTED' }
      });
    }

    // Create usage event
    await prisma.usageEvent.create({
      data: {
        rentalId: rental.id,
        eventType: 'rental_start',
        timestamp: new Date(data.startTime)
      }
    });

    logger.info(`Rental created: ${rental.id} by user ${userId}`);

    res.status(201).json({ rental });
  } catch (error) {
    next(error);
  }
});

// Get user's rentals
router.get('/my-rentals', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    
    const rentals = await prisma.rental.findMany({
      where: { userId },
      include: {
        gpu: {
          include: { server: true }
        },
        cluster: {
          include: { gpus: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ rentals, count: rentals.length });
  } catch (error) {
    next(error);
  }
});

// Get rental by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        gpu: { include: { server: true } },
        cluster: { include: { gpus: true } },
        usageEvents: true
      }
    });

    if (!rental) {
      throw new AppError('Rental not found', 404);
    }

    if (rental.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    res.json({ rental });
  } catch (error) {
    next(error);
  }
});

// End rental
router.post('/:id/end', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const rental = await prisma.rental.findUnique({ where: { id } });

    if (!rental) {
      throw new AppError('Rental not found', 404);
    }

    if (rental.userId !== userId && req.user!.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    if (rental.status !== 'ACTIVE' && rental.status !== 'PENDING') {
      throw new AppError('Rental cannot be ended', 400);
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndTime: new Date()
      }
    });

    // Update GPU status
    if (rental.gpuId) {
      await prisma.gPU.update({
        where: { id: rental.gpuId },
        data: { status: 'AVAILABLE' }
      });
    }

    // Create usage event
    await prisma.usageEvent.create({
      data: {
        rentalId: id,
        eventType: 'rental_end',
        timestamp: new Date()
      }
    });

    logger.info(`Rental ended: ${id}`);

    res.json({ rental: updatedRental });
  } catch (error) {
    next(error);
  }
});

// Extend rental
router.post('/:id/extend', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { endTime } = z.object({ endTime: z.string().datetime() }).parse(req.body);
    const userId = req.user!.id;

    const rental = await prisma.rental.findUnique({ where: { id } });

    if (!rental) {
      throw new AppError('Rental not found', 404);
    }

    if (rental.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: { endTime: new Date(endTime) }
    });

    logger.info(`Rental extended: ${id}`);

    res.json({ rental: updatedRental });
  } catch (error) {
    next(error);
  }
});

export default router;
