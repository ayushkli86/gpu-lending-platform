import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export class BillingService {
  async generateInvoice(rentalId: string): Promise<any> {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { usageEvents: true, user: true }
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    const duration = rental.actualEndTime 
      ? (rental.actualEndTime.getTime() - rental.startTime.getTime()) / (1000 * 60 * 60)
      : 0;

    const amount = duration * rental.hourlyRate;
    const tax = amount * 0.1; // 10% tax
    const totalAmount = amount + tax;

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: rental.userId,
        rentalId: rental.id,
        status: 'PENDING',
        amount,
        tax,
        totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    logger.info(`Invoice generated: ${invoiceNumber} for rental ${rentalId}`);
    return invoice;
  }

  async calculateUsageCost(rentalId: string): Promise<number> {
    const events = await prisma.usageEvent.findMany({
      where: { rentalId }
    });

    let totalCost = 0;
    events.forEach(event => {
      if (event.utilization) {
        totalCost += event.utilization * 0.01; // $0.01 per utilization point
      }
      if (event.dataTransfer) {
        totalCost += event.dataTransfer * 0.001; // $0.001 per MB
      }
    });

    return totalCost;
  }

  async processSubscriptionBilling(subscriptionId: string): Promise<any> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, user: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const invoiceNumber = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const amount = subscription.plan.monthlyPrice;
    const tax = amount * 0.1;
    const totalAmount = amount + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        status: 'PENDING',
        amount,
        tax,
        totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    logger.info(`Subscription invoice generated: ${invoiceNumber}`);
    return invoice;
  }
}

export const billingService = new BillingService();
