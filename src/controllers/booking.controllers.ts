import type { Request, Response } from 'express';
import * as bookingServices from '../services/booking.services.ts';
import * as Sentry from '@sentry/node';
import { z } from 'zod';

const bookingData = z.object({
    passengerFirstName: z.string().min(1).max(100).trim(),
    passengerSurname: z.string().min(1).max(100).trim(),
    passengerDateOfBirth: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    itineraryId: z.string().min(1).max(100),
    travelFrom: z
        .string()
        .length(3)
        .regex(/^[a-zA-Z]{3}$/),
    travelTo: z
        .string()
        .length(3)
        .regex(/^[a-zA-Z]{3}$/),
    offer: z.object({
        id: z.number().int().positive(),
        itineraries: z.array(
            z.object({
                duration: z.string(),
                segments: z.array(
                    z.object({
                        departure: z.object({
                            iataCode: z.string().length(3),
                            at: z.string(),
                        }),
                        arrival: z.object({
                            iataCode: z.string().length(3),
                            at: z.string(),
                        }),
                        carrierCode: z.string(),
                        number: z.string(),
                        id: z.string(),
                    }),
                ),
                id: z.string(),
            }),
        ),
        price: z.object({
            grandTotal: z.string().regex(/^\d+(\.\d{1,2})?$/),
        }),
    }),
});

export const createBookingController = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = bookingData.safeParse(req.body);
        if (!parsed.success) {
            Sentry.captureException(parsed.error);
            res.status(400).json({ message: 'Invalid booking data.' });
            return;
        }

        const {
            passengerFirstName,
            passengerSurname,
            passengerDateOfBirth,
            offer,
            itineraryId,
            travelFrom,
            travelTo,
        } = parsed.data;

        if (!req.userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const result = await bookingServices.createPendingBooking({
            userId: req.userId,
            passengerFirstName,
            passengerSurname,
            passengerDateOfBirth,
            offer,
            itineraryId,
            travelFrom,
            travelTo,
        });

        res.status(201).json(result);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getUserBookingsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await bookingServices.getUserConfirmedBookings(req.userId!);
        res.status(200).json(bookings);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
