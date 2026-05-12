import type { Request, Response } from 'express';
import * as flightSearchServices from '../services/flightSearch.services.js';
import * as Sentry from '@sentry/node';
import { z } from 'zod';

const flightSearchObject = z.object({
    originLocationCode: z.string().regex(/^[a-zA-Z]{3}$/, 'Invalid IATA code'),
    destinationLocationCode: z.string().regex(/^[a-zA-Z]{3}$/, 'Invalid IATA code'),
    departureDate: z.iso.date('Invalid date').refine(
        (validate) => {
            const minDate = new Date().toISOString().slice(0, 10);
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + 330);
            const maxDateStr = maxDate.toISOString().slice(0, 10);
            return validate >= minDate && validate <= maxDateStr;
        },
        { message: 'Flight search is available from now until 330 days in advance' },
    ),
    adults: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive('Number of passengers incorrect')),
});

export const searchFlightsController = async (req: Request, res: Response): Promise<void> => {
    const parseData = flightSearchObject.safeParse(req.query);

    if (!parseData.success) {
        res.status(400).json({
            message: 'Missing or invalid search parameters.',
            errors: z.treeifyError(parseData.error),
        });
        return;
    }

    try {
        const { originLocationCode, destinationLocationCode, departureDate, adults } =
            parseData.data;

        const flightOffers = await flightSearchServices.findFlightOffers({
            originLocationCode,
            destinationLocationCode,
            departureDate,
            adults,
        });

        res.status(200).json(flightOffers);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
