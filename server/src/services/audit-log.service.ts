import mongoose from 'mongoose';
import AuditLog, { IAuditLog } from '../models/AuditLog.model';

class AuditLogService {
    /**
     * Log a state-changing operation (TASK 4.1)
     */
    async logOperation(params: {
        userId?: string;
        userName?: string;
        action: string;
        resource: string;
        resourceId?: string;
        changes?: any;
        ipAddress: string;
        userAgent: string;
        status?: 'success' | 'failure';
        errorMessage?: string;
    }): Promise<void> {
        try {
            await AuditLog.create({
                userId: params.userId,
                userName: params.userName,
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId,
                changes: params.changes,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                status: params.status || 'success',
                errorMessage: params.errorMessage
            });
        } catch (error) {
            console.error('FAILED TO WRITE AUDIT LOG:', error);
        }
    }

    /**
     * Log security event
     */
    async logSecurityEvent(event: {
        userId?: string;
        violation: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void> {
        await this.logOperation({
            userId: event.userId,
            action: 'SECURITY_VIOLATION',
            resource: 'SYSTEM',
            changes: { violation: event.violation, severity: event.severity },
            ipAddress: event.ipAddress || 'unknown',
            userAgent: event.userAgent || 'unknown',
            status: 'failure',
            errorMessage: event.violation
        });

        if (event.severity === 'critical') {
            console.error(`🚨 CRITICAL SECURITY ALERT: ${event.violation}`);
        }
    }

    /**
     * Log authentication attempt
     */
    async logAuthAttempt(userId: string | undefined, identifier: string, success: boolean, message: string, ip?: string, ua?: string): Promise<void> {
        await this.logOperation({
            userId,
            action: 'AUTH_ATTEMPT',
            resource: 'USER',
            changes: { identifier: this.maskData(identifier), success },
            ipAddress: ip || 'unknown',
            userAgent: ua || 'unknown',
            status: success ? 'success' : 'failure',
            errorMessage: success ? undefined : message
        });
    }

    private maskData(data: string): string {
        if (!data) return data;
        if (data.includes('@')) {
            const [user, domain] = data.split('@');
            return `${user.substring(0, 2)}***@${domain}`;
        }
        return `${data.substring(0, 2)}***`;
    }

    async getAuditLogs(filters: any): Promise<IAuditLog[]> {
        const query: any = {};
        if (filters.userId) query.userId = filters.userId;
        if (filters.action) query.action = filters.action;
        if (filters.resource) query.resource = filters.resource;
        
        return await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(filters.limit || 100);
    }
}

export default new AuditLogService();
