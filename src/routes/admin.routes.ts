import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /admin/stats
router.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalGPUs,
      availableGPUs,
      activeRentals,
      totalRentals,
      pendingInvoices,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gPU.count(),
      prisma.gPU.count({ where: { status: 'AVAILABLE' } }),
      prisma.rental.count({ where: { status: 'ACTIVE' } }),
      prisma.rental.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
    ]);

    res.json({
      users: { total: totalUsers },
      gpus: { total: totalGPUs, available: availableGPUs, rented: totalGPUs - availableGPUs },
      rentals: { active: activeRentals, total: totalRentals },
      billing: { pendingInvoices, totalRevenue: revenue._sum.totalAmount ?? 0 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const { role } = z.object({
      role: z.enum(['ADMIN', 'ORG_OWNER', 'USER']).optional(),
    }).parse(req.query);

    const where = role ? { role } : {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          _count: { select: { rentals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/users/:id/role
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.enum(['ADMIN', 'ORG_OWNER', 'USER']) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// GET /admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const { action, userId } = z.object({
      action: z.string().optional(),
      userId: z.string().uuid().optional(),
    }).parse(req.query);

    const where = {
      ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
      ...(userId && { userId }),
    };
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /admin/invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const { status } = z.object({
      status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
    }).parse(req.query);

    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: { rental: { select: { id: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
