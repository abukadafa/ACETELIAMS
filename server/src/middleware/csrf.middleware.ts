import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

// Paths exempt from CSRF — these are protected by rate limiting and
// do not rely on session cookies for auth (they issue tokens instead).
const CSRF_EXEMPT_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/mfa/finalize-login',
];

/**
 * Custom CSRF protection middleware (Double Submit Cookie pattern)
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Only check state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // For GET requests, generate a token if one doesn't exist
        const existingToken = req.cookies?.['_csrf'];
        if (!existingToken) {
            const newToken = crypto.randomBytes(32).toString('hex');
            res.cookie('_csrf', newToken, {
                httpOnly: false, // Must be readable by frontend for Double Submit pattern
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000 // 1 hour
            });
        }
        return next();
    }

    // Skip CSRF check for exempt auth paths
    const requestPath = req.path || req.originalUrl.split('?')[0];
    if (CSRF_EXEMPT_PATHS.some((path) => requestPath === path || requestPath.startsWith(path)) ||
        requestPath.startsWith('/api/auth/reset-password/')) {
        return next();
    }

    // Public admission flows (rate-limited under /api; file validation on upload)
    if (requestPath === '/api/applications/upload' ||
        (req.method === 'POST' && requestPath === '/api/applications')) {
        return next();
    }

    const cookieToken = req.cookies?.['_csrf'];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            message: 'Invalid or missing CSRF token'
        });
    }

    next();
};
