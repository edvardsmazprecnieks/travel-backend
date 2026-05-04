import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
    createBookingController,
    getUserBookingsController,
} from '../controllers/booking.controllers.js';

const router = Router();

router.get('/', authenticateToken, getUserBookingsController);
router.post('/', authenticateToken, createBookingController);

export default router;
