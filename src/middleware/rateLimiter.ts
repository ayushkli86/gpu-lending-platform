import rateLimit from 'express-rate-limit';

const make = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

/** Strict limiter for auth endpoints */
export const authLimiter = make(15 * 60 * 1000, 20, 'Too many auth attempts, try again in 15 minutes');

/** General API limiter */
export const apiLimiter = make(60 * 1000, 120, 'Too many requests, slow down');

/** Admin endpoints */
export const adminLimiter = make(60 * 1000, 60, 'Too many admin requests');
