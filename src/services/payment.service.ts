import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

export class PaymentService {
  async processStripePayment(invoiceId: string, paymentMethodId: string): Promise<any> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(invoice.totalAmount * 100),
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          amount: invoice.totalAmount,
          method: 'STRIPE',
          status: 'COMPLETED',
          stripePaymentId: paymentIntent.id,
          processedAt: new Date()
        }
      });

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() }
      });

      logger.info(`Stripe payment processed: ${paymentIntent.id}`);
      return payment;
    } catch (error: any) {
      logger.error('Stripe payment failed:', error);
      
      await prisma.payment.create({
        data: {
          invoiceId,
          amount: invoice.totalAmount,
          method: 'STRIPE',
          status: 'FAILED',
          metadata: { error: error.message }
        }
      });

      throw error;
    }
  }

  async processCryptoPayment(invoiceId: string, cryptoAddress: string): Promise<any> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Simulated crypto payment (would integrate with CoinGate/NOWPayments)
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: invoice.totalAmount,
        method: 'CRYPTO',
        status: 'PENDING',
        cryptoAddress,
        metadata: { currency: 'BTC' }
      }
    });

    logger.info(`Crypto payment initiated for invoice ${invoiceId}`);
    return payment;
  }

  async recordManualPayment(invoiceId: string, amount: number, transactionId: string): Promise<any> {
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method: 'MANUAL',
        status: 'COMPLETED',
        transactionId,
        processedAt: new Date()
      }
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date() }
    });

    logger.info(`Manual payment recorded: ${transactionId}`);
    return payment;
  }

  async refundPayment(paymentId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    
    if (!payment || payment.status !== 'COMPLETED') {
      throw new Error('Payment cannot be refunded');
    }

    if (payment.method === 'STRIPE' && payment.stripePaymentId) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentId
      });
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' }
    });

    logger.info(`Payment refunded: ${paymentId}`);
    return updated;
  }
}

export const paymentService = new PaymentService();
