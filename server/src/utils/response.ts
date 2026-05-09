import { Response } from 'express';

export const sendResponse = (
    res: Response,
    statusCode: number,
    success: boolean,
    message?: string,
    data?: any,
    errors?: any[]
) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        errors
    });
};

export const successResponse = (res: Response, data?: any, message?: string, statusCode = 200) => {
    return sendResponse(res, statusCode, true, message, data);
};

export const errorResponse = (res: Response, message: string, statusCode = 400, errors?: any[]) => {
    return sendResponse(res, statusCode, false, message, undefined, errors);
};
