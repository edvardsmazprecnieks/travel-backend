import type { Request, Response } from 'express';
import * as flightSearchServices from '../services/flightSearch.services.js';
import * as Sentry from '@sentry/node';

export const searchFlightsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { originLocationCode, destinationLocationCode, departureDate, adults } = req.query;

        const iataCodeRegex = /^[a-zA-Z]{3}$/;
        const travelDateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (
            typeof originLocationCode !== 'string' ||
            typeof destinationLocationCode !== 'string' ||
            typeof departureDate !== 'string' ||
            typeof adults !== 'string' ||
            !iataCodeRegex.test(originLocationCode) ||
            !iataCodeRegex.test(destinationLocationCode) ||
            !travelDateRegex.test(departureDate)
        ) {
            res.status(400).json({ message: 'Missing or invalid required search parameters.' });
            return;
        }

        const numberOfAdults = Number(adults);

        if (!Number.isInteger(numberOfAdults) || numberOfAdults <= 0) {
            res.status(400).json({ message: 'Number of passengers is incorrect.' });
            return;
        }

        const flightOffers = await flightSearchServices.findFlightOffers({
            originLocationCode,
            destinationLocationCode,
            departureDate,
            adults: numberOfAdults,
        });

        res.status(200).json(flightOffers);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
