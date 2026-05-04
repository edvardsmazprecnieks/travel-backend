import { Router } from 'express';
import {
    registerUserController,
    loginUserController,
    refreshTokenController,
    logoutUserController,
    getMeController,
} from '../controllers/users.controllers.ts';
import { authenticateToken } from '../middlewares/auth.middleware.ts';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: 'Too many requests, please try again later.' },
});

// POST /api/users/register - To create a new user
router.post('/register', authLimiter, registerUserController);

router.post('/login', authLimiter, loginUserController);

router.post('/refresh', authLimiter, refreshTokenController);

router.post('/logout', logoutUserController);

router.get('/me', authenticateToken, getMeController);

export default router;
