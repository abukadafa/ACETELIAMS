import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        programme?: string;
        programmes?: string[];
    };
}

/**
 * JWT Authentication Middleware
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as {
            id: string;
            role: string;
            programme?: string;
            programmes?: string[];
        };

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token verification failed, authorization denied' });
    }
};

/**
 * Role-Based Access Control (RBAC) Guard
 */
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to access this resource' });
        }

        next();
    };
};
