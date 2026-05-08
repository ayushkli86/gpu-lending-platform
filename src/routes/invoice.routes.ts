import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

const router = Router();

router.get('/my-invoices', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user!.id },
      include: { payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { payments: true, rental: true, subscription: true }
    });

    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pay', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { method } = req.body;
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });

    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.userId !== req.user!.id) throw new AppError('Access denied', 403);

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: method || 'STRIPE',
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID', paidAt: new Date() }
    });

    res.json({ payment });
  } catch (error) {
    next(error);
  }
});

export default router;
