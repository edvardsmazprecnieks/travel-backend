import * as p from 'drizzle-orm/pg-core';

export const userStatusEnum = p.pgEnum('user_status', ['ACTIVE', 'DISABLED', 'UNVERIFIED']);

export const usersTable = p.pgTable('users', {
    id: p.serial('id').primaryKey(),
    firstName: p.varchar('first_name', { length: 100 }),
    lastName: p.varchar('last_name', { length: 100 }),
    dateOfBirth: p.date('date_of_birth'),
    email: p.text('email').notNull().unique(),
    passwordHash: p.text('password_hash').notNull(),
    createdAt: p.timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: p.timestamp('updated_at', { withTimezone: true }),
    status: userStatusEnum('status').notNull().default('UNVERIFIED'),
    lastLoginAt: p.timestamp('last_login_at', { withTimezone: true }),
    refreshToken: p.text('refresh_token'),
    accessTokenVersion: p.integer('access_token_version').notNull().default(0),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const bookingStatusEnum = p.pgEnum('booking_status', [
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'FAILED',
]);

export const bookingsTable = p.pgTable(
    'bookings',
    {
        id: p.serial('id').primaryKey(),
        userId: p
            .integer('user_id')
            .notNull()
            .references(() => usersTable.id),
        stripeSessionId: p.text('stripe_session_id').unique(),
        stripePaymentIntentId: p.text('stripe_payment_intent_id').unique(),
        status: bookingStatusEnum('status').notNull().default('PENDING'),
        totalPriceCents: p.integer('total_price_cents').notNull(),
        originIata: p.varchar('origin_iata', { length: 3 }).notNull(),
        destinationIata: p.varchar('destination_iata', { length: 3 }).notNull(),
        departureAt: p.timestamp('departure_at', { withTimezone: true }).notNull(),
        arrivalAt: p.timestamp('arrival_at', { withTimezone: true }).notNull(),
        segmentsSummary: p.jsonb('segments_summary').notNull(),
        passengerFirstName: p.varchar('passenger_first_name', { length: 100 }).notNull(),
        passengerSurname: p.varchar('passenger_surname', { length: 100 }).notNull(),
        passengerEmail: p.text('passenger_email').notNull(),
        passengerDateOfBirth: p.date('passenger_date_of_birth'),
        flightOfferSnapshot: p.jsonb('flight_offer_snapshot').notNull(),
        createdAt: p.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: p.timestamp('updated_at', { withTimezone: true }),
        expiresAt: p.timestamp('expires_at', { withTimezone: true }),
    },
    (table) => [p.index('index_bookings_user_id').on(table.userId)],
);

export type InsertBooking = typeof bookingsTable.$inferInsert;
export type SelectBooking = typeof bookingsTable.$inferSelect;

export const ticketStatusEnum = p.pgEnum('ticket_status', [
    'ISSUED',
    'VOIDED',
    'REFUNDED',
    'FAILED',
]);

export const ticketsTable = p.pgTable('tickets', {
    id: p.serial('id').primaryKey(),
    bookingId: p
        .integer('booking_id')
        .notNull()
        .references(() => bookingsTable.id),
    status: ticketStatusEnum('status').notNull(),
    ticketNumbers: p.jsonb('ticket_numbers'),
    ticketProvider: p.varchar('provider', { length: 50 }).notNull(),
    issuedByUserId: p.integer('issued_by_user_id').references(() => usersTable.id),
    issuedAt: p.timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    notes: p.text('notes'),
});

export type InsertTicket = typeof ticketsTable.$inferInsert;
export type SelectTicket = typeof ticketsTable.$inferSelect;
