import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';

export interface TokenPayload {
    userId: number;
    iat: number;
    exp: number;
}

export interface AccessTokenPayload extends TokenPayload {
    tokenVersion: number;
}

export const generateAccessToken = (userId: number, tokenVersion: number): string =>
    jwt.sign({ userId, tokenVersion }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });

export const generateRefreshToken = (userId: number): string =>
    jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw error;
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw error;
        } else {
            Sentry.captureException(error);
        }
        return null;
    }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
    } catch {
        return null;
    }
};
