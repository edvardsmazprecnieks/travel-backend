import type { Request, Response } from 'express';
import * as userServices from '../services/users.services.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../utils/jwt.utils.js';
import * as Sentry from '@sentry/node';
import { z } from 'zod';

const emailPassword = z.object({
    email: z.email(),
    password: z.string().min(8).max(128),
});

export const registerUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = emailPassword.safeParse(req.body);
        if (!parsed.success) {
            Sentry.captureException(parsed.error);
            res.status(400).json({ message: 'Invalid email or password format' });
            return;
        }
        const { email, password } = parsed.data;
        const newUser = await userServices.createUser({ email, password });
        res.status(201).json(newUser);
        return;
    } catch (error) {
        Sentry.captureException(error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (message.includes('already exists')) {
            res.status(409).json({ message });
            return;
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const loginUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = emailPassword.safeParse(req.body);
        if (!parsed.success) {
            Sentry.captureException(parsed.error);
            res.status(400).json({ message: 'Invalid email or password format' });
            return;
        }
        const { email, password } = parsed.data;

        const loggedInUser = await userServices.loginUser({ email, password });

        const accessToken = generateAccessToken(loggedInUser.id, loggedInUser.accessTokenVersion);
        const refreshToken = generateRefreshToken(loggedInUser.id);

        await userServices.saveRefreshToken(loggedInUser.id, refreshToken);

        res.cookie('refreshToken', refreshToken, {
            domain: 'travelapp-frontend-statid.onrender.com',
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.status(200).json({ accessToken, user: loggedInUser });
    } catch (error) {
        Sentry.captureException(error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        if (message.includes('Invalid ')) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const logoutUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            const payload = verifyRefreshToken(token);
            if (payload) {
                await userServices.clearTokens(payload.userId);
            }
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
        });

        res.status(204).send();
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
    try {
        const clearRefreshCookie = () => {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/',
            });
        };

        const token = req.cookies?.refreshToken;
        console.log(token);

        if (!token) {
            res.status(401).json({ message: 'Refresh token missing.' });
            return;
        }

        const payload = verifyRefreshToken(token);
        if (!payload) {
            clearRefreshCookie();
            res.status(403).json({ message: 'Invalid or expired refresh token.' });
            return;
        }

        const storedTokenUser = await userServices.findUserByID(payload.userId);
        const storedToken = storedTokenUser.refreshToken;

        if (!storedToken || storedToken !== token) {
            clearRefreshCookie();
            res.status(403).json({ message: 'Refresh token reuse detected or revoked.' });
            return;
        }

        const newAccessToken = generateAccessToken(
            payload.userId,
            storedTokenUser.accessTokenVersion,
        );

        res.status(200).json({ accessToken: newAccessToken, user: storedTokenUser });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// see if this protected route sample should be kept

export const getMeController = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await userServices.findUserByID(req.userId!);

        if (!user) {
            res.status(404).json({ message: 'User not found. ' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
