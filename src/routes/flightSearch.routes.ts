import { Router } from 'express';
import { searchFlightsController } from '../controllers/flightSearch.controllers.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: 'Too many requests, please try again later.' },
});

router.get('/', authLimiter, searchFlightsController);

export default router;
