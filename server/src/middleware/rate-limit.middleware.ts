import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const apiRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isDev ? 1000 : 100,
    message: 'Too many requests from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 10,
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
