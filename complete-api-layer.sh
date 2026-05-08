#!/bin/bash
set -e
cd ~/gpu-lending-platform

echo "🔌 Completing API Layer..."

# Task 3.1: Fix auth middleware
echo "📝 Task 3.1: Fix Authentication Middleware..."

cat > src/middleware/auth.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireOrgOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ORG_OWNER' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Organization owner access required' });
  }
  next();
};
EOF

echo "✅ Auth middleware fixed"

# Task 3.2: Complete Spot API
echo "📝 Task 3.2: Complete Spot API Routes..."

cat > src/routes/spot.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { spotService } from '../services/spot.service';
import { z } from 'zod';

const router = Router();

const createRequestSchema = z.object({
  gpuType: z.string().min(1),
  maxPrice: z.number().positive(),
  duration: z.number().int().positive(),
});

// Create spot request
router.post('/request', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createRequestSchema.parse(req.body);
    const request = await spotService.createRequest({
      userId: req.user!.id,
      ...data,
    });
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List spot requests
router.get('/requests', authenticate, async (req: AuthRequest, res) => {
  try {
    const requests = await spotService.listRequests(req.user!.id);
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel spot request
router.delete('/requests/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await spotService.cancelRequest(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
EOF

echo "✅ Spot API complete"

# Task 3.3: Complete MIG API
echo "📝 Task 3.3: Complete MIG API Routes..."

cat > src/routes/mig.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { migService } from '../services/mig.service';
import { z } from 'zod';

const router = Router();

const enableMIGSchema = z.object({
  profile: z.string().min(1),
});

// Enable MIG on GPU
router.post('/gpus/:id/enable', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { profile } = enableMIGSchema.parse(req.body);
    const gpu = await migService.enableMIG(req.params.id, profile);
    res.json({ success: true, data: gpu });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create MIG instance
router.post('/gpus/:id/instances', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { profile } = enableMIGSchema.parse(req.body);
    const instance = await migService.createInstance(req.params.id, profile);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List MIG instances
router.get('/gpus/:id/instances', authenticate, async (req: AuthRequest, res) => {
  try {
    const instances = await migService.listInstances(req.params.id);
    res.json({ success: true, data: instances });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List MIG profiles
router.get('/profiles', authenticate, async (req: AuthRequest, res) => {
  try {
    const profiles = migService.getProfiles();
    res.json({ success: true, data: profiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
EOF

echo "✅ MIG API complete"

# Task 3.4: Complete Metrics API
echo "📝 Task 3.4: Complete Metrics API Routes..."

cat > src/routes/metrics.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { metricsService } from '../services/metrics.service';

const router = Router();

// Get GPU metrics
router.get('/gpus/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const metrics = await metricsService.getLatestMetrics(req.params.id);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics history
router.get('/gpus/:id/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const history = await metricsService.getMetricsHistory(req.params.id, hours);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated metrics
router.get('/gpus/:id/aggregated', authenticate, async (req: AuthRequest, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const aggregated = await metricsService.getAggregatedMetrics(req.params.id, hours);
    res.json({ success: true, data: aggregated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts
router.get('/gpus/:id/alerts', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = await metricsService.checkAlerts(req.params.id);
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
EOF

echo "✅ Metrics API complete"

# Install zod
npm install zod

# Build
echo "🔨 Building..."
npm run build

# Commit
git add -A
git commit -m "feat: complete API layer

- Fixed authentication middleware
- Completed Spot API with validation
- Completed MIG API with admin checks
- Completed Metrics API with aggregation

Tasks 3.1, 3.2, 3.3, 3.4 complete ✅"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 API Layer complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Completed:"
echo "  - Task 3.1: Auth middleware"
echo "  - Task 3.2: Spot API"
echo "  - Task 3.3: MIG API"
echo "  - Task 3.4: Metrics API"
echo ""
echo "📊 Progress: 69%"
echo ""
