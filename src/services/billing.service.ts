import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export class BillingService {
  async generateRentalInvoice(rentalId: string): Promise<ReturnType<typeof prisma.invoice.create>> {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!rental) throw new Error(`Rental ${rentalId} not found`);

    const end = rental.actualEndTime ?? new Date();
    const durationHours = Math.max(
      (end.getTime() - rental.startTime.getTime()) / 3_600_000,
      0
    );

    const amount = parseFloat((durationHours * rental.hourlyRate).toFixed(2));
    const tax = parseFloat((amount * 0.1).toFixed(2));
    const totalAmount = parseFloat((amount + tax).toFixed(2));
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: rental.userId,
        rentalId: rental.id,
        status: 'PENDING',
        amount,
        tax,
        totalAmount,
        dueDate: new Date(Date.now() + 7 * 86_400_000),
      },
    });

    logger.info(`Invoice ${invoiceNumber} generated for rental ${rentalId} — $${totalAmount}`);
    return invoice;
  }

  async processSubscriptionBilling(subscriptionId: string): Promise<ReturnType<typeof prisma.invoice.create>> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    if (!subscription) throw new Error(`Subscription ${subscriptionId} not found`);

    const amount = subscription.plan.monthlyPrice;
    const tax = parseFloat((amount * 0.1).toFixed(2));
    const totalAmount = parseFloat((amount + tax).toFixed(2));
    const invoiceNumber = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        status: 'PENDING',
        amount,
        tax,
        totalAmount,
        dueDate: new Date(Date.now() + 7 * 86_400_000),
      },
    });

    logger.info(`Subscription invoice ${invoiceNumber} generated — $${totalAmount}`);
    return invoice;
  }
}

export const billingService = new BillingService();
