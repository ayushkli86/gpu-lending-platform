import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createServerSchema = z.object({
  name: z.string(),
  hostname: z.string(),
  ipAddress: z.string().ip(),
  location: z.string().optional()
});

const createGPUSchema = z.object({
  serverId: z.string().uuid(),
  model: z.string(),
  memory: z.number().positive(),
  computeCapability: z.string(),
  pcieBusId: z.string()
});

// Get all GPU servers
router.get('/servers', authenticate, async (req, res, next) => {
  try {
    const servers = await prisma.gPUServer.findMany({
      include: {
        gpus: {
          select: {
            id: true,
            model: true,
            status: true
          }
        }
      }
    });
    res.json({ servers });
  } catch (error) {
    next(error);
  }
});

// Create GPU server (admin only)
router.post('/servers', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = createServerSchema.parse(req.body);
    const server = await prisma.gPUServer.create({ data });
    res.status(201).json({ server });
  } catch (error) {
    next(error);
  }
});

// Get all GPUs with filters
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, model } = req.query;
    
    const gpus = await prisma.gPU.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(model && { model: { contains: model as string, mode: 'insensitive' } })
      },
      include: {
        server: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });
    
    res.json({ gpus, count: gpus.length });
  } catch (error) {
    next(error);
  }
});

// Get available GPUs
router.get('/available', authenticate, async (req, res, next) => {
  try {
    const gpus = await prisma.gPU.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        server: true
      }
    });
    res.json({ gpus, count: gpus.length });
  } catch (error) {
    next(error);
  }
});

// Create GPU (admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = createGPUSchema.parse(req.body);
    
    const server = await prisma.gPUServer.findUnique({
      where: { id: data.serverId }
    });
    
    if (!server) {
      throw new AppError('Server not found', 404);
    }
    
    const gpu = await prisma.gPU.create({ data });
    res.status(201).json({ gpu });
  } catch (error) {
    next(error);
  }
});

// Update GPU status
router.patch('/:id/status', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OFFLINE']) }).parse(req.body);
    
    const gpu = await prisma.gPU.update({
      where: { id },
      data: { status }
    });
    
    res.json({ gpu });
  } catch (error) {
    next(error);
  }
});

// Create GPU cluster
router.post('/clusters', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, gpuIds } = z.object({
      name: z.string(),
      gpuIds: z.array(z.string().uuid())
    }).parse(req.body);
    
    const cluster = await prisma.gPUCluster.create({
      data: {
        name,
        gpus: {
          connect: gpuIds.map(id => ({ id }))
        }
      },
      include: { gpus: true }
    });
    
    res.status(201).json({ cluster });
  } catch (error) {
    next(error);
  }
});

export default router;
