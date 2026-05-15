import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, blacklistToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

const JWT_SECRET = () => process.env.JWT_SECRET!;
const REFRESH_EXPIRES_DAYS = 30;

function signAccess(payload: { userId: string; email: string; role: string }) {
  // cast to any to avoid strict StringValue type mismatch in @types/jsonwebtoken
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered', 400);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: 'USER' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    logger.info(`User registered: ${email}`);
    res.status(201).json({ message: 'Registered successfully', user });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = signAccess({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = await createRefreshToken(user.id);

    logger.info(`User logged in: ${email}`);
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const record = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    const newRefreshToken = await createRefreshToken(record.userId);
    const accessToken = signAccess({ userId: record.user.id, email: record.user.email, role: record.user.role });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(req.body);

    // Blacklist the access token
    const token = req.headers.authorization?.slice(7);
    if (token) {
      try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
        if (ttl > 0) await blacklistToken(token, ttl);
      } catch {
        // ignore
      }
    }

    // Revoke refresh token if provided
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user!.id },
        data: { revokedAt: new Date() },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, organizationId: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
