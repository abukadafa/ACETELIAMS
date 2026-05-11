import { Request, Response, NextFunction } from 'express';
import auditLogService from '../services/audit-log.service';
import logger from '../utils/logger';

/**
 * Global Middleware to capture all state-changing operations (POST, PUT, DELETE, PATCH)
 */
export const auditMiddleware = (req: any, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log ALL requests in production for observability (Task B)
    res.on('finish', async () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id || 'anonymous'
        };

        if (res.statusCode >= 500) {
            logger.error('API Error Response', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('API Warning Response', logData);
        } else {
            logger.info('API Request Success', logData);
        }

        // Only capture state-changing methods for the detailed Audit Log
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            // Skip specific routes like health checks or read-only logs if they were POST (rare)
            if (req.path.includes('/health') || req.path.includes('/audit-logs/view')) {
                return;
            }

            try {
                const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
                
                // Determine Action and Resource
                const pathParts = req.path.split('/').filter(Boolean);
                const resource = pathParts[1] || 'system';
                const action = `${req.method}_${resource.toUpperCase()}`;

                // Extract resource ID if present (usually /api/resource/:id)
                const resourceId = req.params.id || pathParts[2];

                // Sanitize body (Exclude passwords and sensitive secrets)
                const sanitizedBody = { ...req.body };
                const sensitiveKeys = ['password', 'token', 'secret', 'mfaSecret', 'otp'];
                sensitiveKeys.forEach(key => {
                    if (sanitizedBody[key]) sanitizedBody[key] = '********';
                });

                await auditLogService.logOperation({
                    userId: req.user?.id,
                    userName: req.user?.name || req.user?.username,
                    action,
                    resource,
                    resourceId,
                    changes: {
                        method: req.method,
                        path: req.path,
                        params: req.params,
                        query: req.query,
                        body: sanitizedBody,
                        status: res.statusCode
                    },
                    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                    userAgent: req.get('user-agent') || 'unknown',
                    status: isSuccess ? 'success' : 'failure',
                    errorMessage: isSuccess ? undefined : (res.locals.responseBody?.message || 'Operation failed')
                });
            } catch (error) {
                logger.error('Audit Persistence Failed', { error, path: req.path });
            }
        }
    });

    // Capture response body for error logging
    const originalJson = res.json;
    res.json = function(body: any) {
        res.locals.responseBody = body;
        return originalJson.call(this, body);
    };

    next();
};
