import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const globalErrorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Token invalid or expired' });
        return;
    }

    console.error('Unhandled error');
    res.status(500).json({ message: 'Internal server error' });
};
