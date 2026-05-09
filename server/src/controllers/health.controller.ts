import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { successResponse, errorResponse } from '../utils/response';

export const getDbHealth = async (req: Request, res: Response) => {
    try {
        const state = mongoose.connection.readyState;
        
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (state !== 1) {
            return errorResponse(res, 'Database is not connected', 503);
        }

        const start = Date.now();
        const admin = mongoose.connection.db?.admin();
        const serverStatus = await admin?.serverStatus();
        const ping = Date.now() - start;

        return successResponse(res, {
            status: 'ok',
            ping: `${ping}ms`,
            connections: {
                current: serverStatus?.connections?.current,
                available: serverStatus?.connections?.available
            },
            uptime: serverStatus?.uptime,
            version: serverStatus?.version
        }, 'Database health check successful');
    } catch (error: any) {
        return errorResponse(res, 'Database health check failed', 503, [error.message]);
    }
};
