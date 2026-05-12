import { describe, expect, test, beforeAll, vi } from 'vitest';

vi.mock('amadeus-ts', () => ({
    default: class Amadeus {
        constructor() {}
    },
    ResponseError: class ResponseError extends Error {},
}));

import { findFlightOffers } from '../../services/flightSearch.services.js';

beforeAll(() => {
    process.env.USE_MOCK = 'true';
});

describe('findFlightOffer (in mock)', () => {
    test('returns flight offers successfully', async () => {
        const offers = await findFlightOffers({
            originLocationCode: 'BER',
            destinationLocationCode: 'RIX',
            departureDate: '2025-08-15',
            adults: 1,
        });
        expect(offers.length).toBeGreaterThan(0);
        expect(Array.isArray(offers)).toBe(true);
        expect(offers[0]).toHaveProperty('id');
        expect(offers[0]).toHaveProperty('price.grandTotal');
        expect(offers[0]!.itineraries[0]).toHaveProperty('duration');
        expect(offers[0]!.itineraries[0]).toHaveProperty('id');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('departure.iataCode');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('departure.at');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('arrival.iataCode');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('arrival.at');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('carrierCode');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('number');
        expect(offers[0]!.itineraries[0]!.segments[0]).toHaveProperty('id');
        expect(Number.isInteger(offers[0]!.id)).toBe(true);
    });
});
