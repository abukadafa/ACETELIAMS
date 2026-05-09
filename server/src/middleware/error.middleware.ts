import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { env } from '../config/env';

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(`[ERROR] ${err.message}`, err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // In development, include stack trace
    const errors = env.NODE_ENV === 'development' ? [err.stack] : undefined;

    return errorResponse(res, message, statusCode, errors);
};
