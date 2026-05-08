#!/bin/bash

# Fix TypeScript errors automatically

echo "🔧 Fixing TypeScript errors..."

# Fix auth middleware - add explicit returns
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

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const requireOrgOwner = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ORG_OWNER' && req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Organization owner access required' });
    return;
  }
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
EOF

# Fix error handler
cat > src/middleware/errorHandler.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
};
EOF

# Fix index.ts
sed -i 's/app.get(.health., (req, res)/app.get("\/health", (_req, res)/g' src/index.ts
sed -i 's/app.use((err: any, req:/app.use((err: any, _req:/g' src/index.ts
sed -i 's/, next: express.NextFunction)/, _next: express.NextFunction)/g' src/index.ts

# Fix gpu.routes.ts - restore req where needed
sed -i 's/async (_req, res, next)/async (req, res, next)/g' src/routes/gpu.routes.ts

# Fix unused imports
sed -i 's/import { authenticate, authorize }/import { authenticate }/g' src/routes/invoice.routes.ts

# Fix mig.routes.ts
sed -i 's/router.get(.profiles., authenticate, async (req,/router.get("\/profiles", authenticate, async (_req,/g' src/routes/mig.routes.ts

# Fix mock.routes.ts
sed -i 's/router.post(.seed., async (req,/router.post("\/seed", async (_req,/g' src/routes/mock.routes.ts

echo "✅ TypeScript fixes applied"
