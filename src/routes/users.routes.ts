import { Router } from 'express';
import {
    registerUserController,
    loginUserController,
    refreshTokenController,
    logoutUserController,
    getMeController,
} from '../controllers/users.controllers.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { doubleCsrfProtection, generateCsrfToken } from '../utils/csrf.utils.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: 'Too many requests, please try again later.' },
});

// POST /api/users/register - To create a new user
router.post('/register', authLimiter, registerUserController);

router.post('/login', authLimiter, loginUserController);

router.post('/refresh', authLimiter, doubleCsrfProtection, refreshTokenController);

router.post('/logout', doubleCsrfProtection, logoutUserController);

router.get('/me', authenticateToken, getMeController);

router.get('/csrf-token', (req, res) => {
    const token = generateCsrfToken(req, res);
    res.status(200).json({ csrfToken: token });
});

export default router;
