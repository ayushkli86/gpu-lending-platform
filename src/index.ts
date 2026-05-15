import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, adminLimiter } from './middleware/rateLimiter';
import { cache } from './services/cache.service';
import authRoutes from './routes/auth.routes';
import gpuRoutes from './routes/gpu.routes';
import rentalRoutes from './routes/rental.routes';
import subscriptionRoutes from './routes/subscription.routes';
import invoiceRoutes from './routes/invoice.routes';
import adminRoutes from './routes/admin.routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check (no rate limit)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), cache: cache.isConnected() });
});

// Swagger docs
setupSwagger(app);

// API routes with tiered rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/gpus', apiLimiter, gpuRoutes);
app.use('/api/v1/rentals', apiLimiter, rentalRoutes);
app.use('/api/v1/subscriptions', apiLimiter, subscriptionRoutes);
app.use('/api/v1/invoices', apiLimiter, invoiceRoutes);
app.use('/api/v1/admin', adminLimiter, adminRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

async function start() {
  await cache.connect();
  app.listen(PORT, () => {
    logger.info(`GPU Lending Platform running on port ${PORT}`);
    logger.info(`Swagger: http://localhost:${PORT}/api-docs`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});

export default app;
