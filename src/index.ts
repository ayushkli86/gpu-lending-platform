import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import gpuRoutes from './routes/gpu.routes';
import rentalRoutes from './routes/rental.routes';
import subscriptionRoutes from './routes/subscription.routes';
import invoiceRoutes from './routes/invoice.routes';
import adminRoutes from './routes/admin.routes';
import mockRoutes from './routes/mock.routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const USE_MOCK = process.env.USE_MOCK === 'true' || true; // Use mock by default

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
if (USE_MOCK) {
  logger.info('🎭 Using MOCK data (database not required)');
  app.use('/api/v1', mockRoutes);
} else {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/gpus', gpuRoutes);
  app.use('/api/v1/rentals', rentalRoutes);
  app.use('/api/v1/subscriptions', subscriptionRoutes);
  app.use('/api/v1/invoices', invoiceRoutes);
  app.use('/api/v1/admin', adminRoutes);
}

// Swagger documentation
if (USE_MOCK) {
  // Simplified swagger for mock mode
  app.get('/api-docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>GPU Lending Platform API</title>
      <style>body{font-family:Arial;padding:40px;background:#f5f5f5;}
      .container{max-width:800px;margin:0 auto;background:white;padding:30px;border-radius:10px;}
      h1{color:#667eea;}h2{color:#333;border-bottom:2px solid #667eea;padding-bottom:10px;}
      .endpoint{background:#f9f9f9;padding:15px;margin:10px 0;border-left:4px solid #667eea;}
      .method{display:inline-block;padding:5px 10px;border-radius:5px;color:white;font-weight:bold;}
      .get{background:#61affe;}.post{background:#49cc90;}</style></head>
      <body><div class="container">
      <h1>🖥️ GPU Lending Platform API</h1>
      <p>Mock Mode - All endpoints available at <code>http://localhost:3000/api/v1</code></p>
      <h2>Authentication</h2>
      <div class="endpoint"><span class="method post">POST</span> /auth/login - Login user</div>
      <div class="endpoint"><span class="method post">POST</span> /auth/register - Register user</div>
      <h2>GPUs</h2>
      <div class="endpoint"><span class="method get">GET</span> /gpus - List all GPUs</div>
      <div class="endpoint"><span class="method get">GET</span> /gpus/servers - List GPU servers</div>
      <div class="endpoint"><span class="method get">GET</span> /gpus/available - Available GPUs</div>
      <h2>Rentals</h2>
      <div class="endpoint"><span class="method get">GET</span> /rentals/my-rentals - My rentals</div>
      <h2>Subscriptions</h2>
      <div class="endpoint"><span class="method get">GET</span> /subscriptions/plans - List plans</div>
      <div class="endpoint"><span class="method post">POST</span> /subscriptions - Subscribe</div>
      <h2>Admin</h2>
      <div class="endpoint"><span class="method get">GET</span> /admin/stats - Platform stats</div>
      </div></body></html>
    `);
  });
} else {
  setupSwagger(app);
}

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`🚀 GPU Lending Platform running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
