import Amadeus, { type FlightOffersSearchGetResult, ResponseError } from 'amadeus-ts';
import mockData from '../flight-mock-data.json' with { type: 'json' };
import * as Sentry from '@sentry/node';

const amadeus = new Amadeus({
    clientId: process.env['AMADEUS_CLIENT_ID']!,
    clientSecret: process.env['AMADEUS_SERVICE_SECRET']!,
    hostname: 'test',
});

type CleanedFlightOffer = {
    id: number;
    itineraries: Array<{
        duration: string;
        segments: Array<{
            departure: {
                iataCode: string;
                at: string;
            };
            arrival: {
                iataCode: string;
                at: string;
            };
            carrierCode: string;
            number: string;
            id: string;
        }>;
        id: string;
    }>;
    price: {
        grandTotal: string;
    };
};

export type { CleanedFlightOffer };

function mapFlightOfferOutput(
    rawData: FlightOffersSearchGetResult['data'][number],
): CleanedFlightOffer {
    if (rawData.price.grandTotal === undefined) {
        throw new Error('Flight offer is missing a price.');
    }

    const idAsNumber = Number(rawData['id']);

    if (!Number.isInteger(idAsNumber)) {
        throw new Error('Flight offer have non-integer ID.');
    }

    return {
        id: idAsNumber,
        itineraries: rawData['itineraries'].map((itinerary, index) => ({
            duration: itinerary.duration,
            segments: itinerary.segments.map((segment) => ({
                departure: {
                    iataCode: segment.departure.iataCode,
                    at: segment.departure.at,
                },
                arrival: {
                    iataCode: segment.arrival.iataCode,
                    at: segment.arrival.at,
                },
                carrierCode: segment.carrierCode,
                number: segment.number,
                id: segment.id,
            })),
            id: `${rawData['id']}-itinerary-${index}`,
        })),
        price: {
            grandTotal: rawData.price.grandTotal,
        },
    };
}

export interface FlightSearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    adults: number;
}

export const findFlightOffers = async (
    params: FlightSearchParams,
): Promise<CleanedFlightOffer[]> => {
    try {
        if (process.env['USE_MOCK'] === 'true') {
            return mockData as CleanedFlightOffer[];
        }
        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: params.originLocationCode,
            destinationLocationCode: params.destinationLocationCode,
            departureDate: params.departureDate,
            adults: params.adults,
        });

        return response.data.map(mapFlightOfferOutput);
    } catch (error) {
        Sentry.captureException(error);
        if (error instanceof ResponseError) {
            console.error('Amadeus API error:', error.code);
        }
        if (error instanceof Error) {
            console.error('Error fetching flight offers:', error.message);
        }
        throw error;
    }
};
