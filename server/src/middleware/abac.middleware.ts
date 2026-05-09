import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import Role from '../models/Role.model';
import User from '../models/User.model';

export interface PolicyContext {
    user: any;
    resource: string;
    action: string;
    environment: {
        time: string;
        ip: string;
    };
}

export const abacGuard = (policy: (context: PolicyContext) => Promise<boolean> | boolean) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const context: PolicyContext = {
            user: req.user,
            resource: req.baseUrl + req.path,
            action: req.method,
            environment: {
                time: new Date().toISOString(),
                ip: req.ip || '',
            },
        };

        const result = await Promise.resolve(policy(context));
        if (!result) {
            return res.status(403).json({
                message: 'Access denied: Policy evaluation failed (ABAC)'
            });
        }

        next();
    };
};

/**
 * Middleware to check if the current user has a specific permission
 */
export const hasPermission = (permissionCode: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            // Fetch user with role reference
            const user = await User.findById(req.user.id).populate({
                path: 'roleRef',
                populate: { path: 'permissions' }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Implementation of Permission-based check
            const role = user.roleRef as any;
            if (!role) {
                // Fallback for system admin string if roleRef missing
                if (user.role === 'admin') return next();
                return res.status(403).json({ message: 'No role assigned to this user' });
            }

            const hasPerm = role.permissions.some((p: any) => p.code === permissionCode);
            
            // System roles might have all permissions
            if (hasPerm || (role.name === 'admin')) {
                return next();
            }

            return res.status(403).json({ 
                message: `Permission denied: Required capability [${permissionCode}] not found for role [${role.displayName}]` 
            });
        } catch (error: any) {
            res.status(500).json({ message: 'Error checking permissions', error: error.message });
        }
    };
};
