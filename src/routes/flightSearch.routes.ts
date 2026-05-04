import { Router } from 'express';
import { searchFlightsController } from '../controllers/flightSearch.controllers.ts';
import rateLimit from 'express-rate-limit';
const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: 'Too many requests, please try again later.' },
});

router.post('/', authLimiter, searchFlightsController);

export default router;
