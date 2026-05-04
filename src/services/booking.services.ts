import { db } from '../db/db.ts';
import { bookingsTable, ticketsTable } from '../db/schema.ts';
import type { CleanedFlightOffer } from './flightSearch.services.ts';
import { findUserByID } from './users.services.ts';
import { stripe } from '../lib/stripe.ts';
import { and, eq } from 'drizzle-orm';

interface CreateBookingParams {
    userId: number;
    passengerFirstName: string;
    passengerSurname: string;
    passengerDateOfBirth: string | null;
    offer: CleanedFlightOffer;
    itineraryId: string;
    travelFrom: string;
    travelTo: string;
}

export const createPendingBooking = async (params: CreateBookingParams) => {
    const {
        userId,
        passengerFirstName,
        passengerSurname,
        passengerDateOfBirth,
        offer,
        itineraryId,
        travelFrom,
        travelTo,
    } = params;

    const itinerary = offer.itineraries.find((itinerary) => itinerary.id === itineraryId);
    if (!itinerary || itinerary.segments.length === 0) {
        throw new Error('Itinerary not found in the provided offer');
    }

    const firstSegment = itinerary.segments[0]!;
    const lastSegment = itinerary.segments[itinerary.segments.length - 1]!;

    const totalPriceCents = Math.round(parseFloat(offer.price.grandTotal) * 100);

    const user = await findUserByID(userId);

    const [booking] = await db
        .insert(bookingsTable)
        .values({
            userId,
            status: 'PENDING',
            totalPriceCents,
            originIata: travelFrom,
            destinationIata: travelTo,
            departureAt: new Date(firstSegment.departure.at),
            arrivalAt: new Date(lastSegment.arrival.at),
            segmentsSummary: itinerary.segments,
            passengerFirstName,
            passengerSurname,
            passengerEmail: user.email,
            passengerDateOfBirth,
            flightOfferSnapshot: offer,
            createdAt: new Date(),
        })
        .returning();

    if (!booking) {
        throw new Error('Failed to create booking');
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Flight ${travelFrom} > ${travelTo}`,
                        description: `${itinerary.segments.map((segment) => `${segment.departure.iataCode}>${segment.arrival.iataCode}`).join(', ')}`,
                    },
                    unit_amount: totalPriceCents,
                },
                quantity: 1,
            },
        ],
        metadata: {
            bookingId: booking.id.toString(),
        },
        success_url: `${process.env.FRONTEND_URL}/booking/success?bookingId=${booking.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/booking/cancelled?bookingId=${booking.id}`,
    });

    await db
        .update(bookingsTable)
        .set({ stripeSessionId: session.id })
        .where(eq(bookingsTable.id, booking.id));

    return {
        bookingId: booking.id,
        checkoutUrl: session.url!,
    };
};

export const getUserConfirmedBookings = async (userId: number) => {
    const bookings = await db
        .select()
        .from(bookingsTable)
        .where(and(eq(bookingsTable.userId, userId), eq(bookingsTable.status, 'CONFIRMED')))
        .orderBy(bookingsTable.departureAt);
    const bookingsWithTickets = await Promise.all(
        bookings.map(async (booking) => {
            const tickets = await db
                .select()
                .from(ticketsTable)
                .where(eq(ticketsTable.bookingId, booking.id));
            return { ...booking, tickets };
        }),
    );

    return bookingsWithTickets;
};
