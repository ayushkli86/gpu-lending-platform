import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalGPUs, activeRentals, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.gPU.count(),
      prisma.rental.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      totalUsers,
      totalGPUs,
      activeRentals,
      totalRevenue: totalRevenue._sum.amount || 0
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { rentals: true } }
      }
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get('/rentals', async (req, res, next) => {
  try {
    const rentals = await prisma.rental.findMany({
      include: {
        user: { select: { email: true, name: true } },
        gpu: { include: { server: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ rentals });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

export default router;
