import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import prisma from '../utils/prisma';
import { cache } from '../services/cache.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const BLACKLIST_PREFIX = 'blacklist:';

export async function blacklistToken(token: string, expiresIn: number): Promise<void> {
  await cache.set(`${BLACKLIST_PREFIX}${token}`, 1, expiresIn);
}

async function isBlacklisted(token: string): Promise<boolean> {
  const val = await cache.get(`${BLACKLIST_PREFIX}${token}`);
  return val !== null;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // --- API Key auth ---
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (apiKey) {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: { select: { id: true, email: true, role: true } } },
      });
      if (!keyRecord) throw new AppError('Invalid API key', 401);

      // update lastUsed async, don't await
      prisma.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsed: new Date() } }).catch(() => {});

      req.user = keyRecord.user;
      return next();
    }

    // --- Bearer JWT auth ---
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.slice(7);

    if (await isBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
