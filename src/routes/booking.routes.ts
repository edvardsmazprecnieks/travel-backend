import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.ts';
import {
    createBookingController,
    getUserBookingsController,
} from '../controllers/booking.controllers.ts';

const router = Router();

router.get('/', authenticateToken, getUserBookingsController);
router.post('/', authenticateToken, createBookingController);

export default router;
