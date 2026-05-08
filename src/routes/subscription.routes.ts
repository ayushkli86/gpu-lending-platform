import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/plans', async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

router.post('/plans', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, description, monthlyPrice, gpuAllocation } = z.object({
      name: z.string(),
      description: z.string().optional(),
      monthlyPrice: z.number().positive(),
      gpuAllocation: z.number().int().positive()
    }).parse(req.body);

    const plan = await prisma.subscriptionPlan.create({
      data: { name, description, monthlyPrice, gpuAllocation }
    });

    res.status(201).json({ plan });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { planId } = z.object({ planId: z.string().uuid() }).parse(req.body);
    const userId = req.user!.id;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError('Plan not found', 404);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'TRIAL',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      include: { plan: true }
    });

    res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
});

router.get('/my-subscriptions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ subscriptions });
  } catch (error) {
    next(error);
  }
});

export default router;
