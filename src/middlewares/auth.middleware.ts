import type { Request, Response, NextFunction } from 'express';
import * as userServices from '../services/users.services.ts';
import { verifyAccessToken } from '../utils/jwt.utils.ts';
import * as Sentry from '@sentry/node';

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            res.status(401).json({ message: 'Access token missing.' });
            return;
        }

        const payload = verifyAccessToken(token);
        if (!payload) {
            res.status(403).json({ message: 'Invalid or expired access token.' });
            return;
        }

        const user = await userServices.findUserByID(payload.userId);
        if (user.accessTokenVersion !== payload.tokenVersion) {
            res.status(401).json({ message: 'Session expired. Please log in again.' });
            return;
        }

        req.userId = payload.userId;
        next();
    } catch (error) {
        Sentry.captureException(error);
        next(error);
    }
};
