import express, { Router } from 'express';
import type Stripe from 'stripe';
import { stripe } from '../lib/stripe.ts';
import { bookingsTable } from '../db/schema.ts';
import { db } from '../db/db.ts';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

const router = Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );
    } catch (error) {
        Sentry.captureException(error);
        res.status(400).send(`Webhook Error: ${(error as Error).message}`);
        return;
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const bookingId = session.metadata?.bookingId;

            if (bookingId) {
                await db
                    .update(bookingsTable)
                    .set({
                        status: 'CONFIRMED',
                        stripePaymentIntentId:
                            typeof session.payment_intent === 'string'
                                ? session.payment_intent
                                : null,
                        updatedAt: new Date(),
                    })
                    .where(eq(bookingsTable.id, parseInt(bookingId, 10)));
            }
            break;
        }
        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;
            const bookingId = session.metadata?.bookingId;

            if (bookingId) {
                await db
                    .update(bookingsTable)
                    .set({ status: 'CANCELLED', updatedAt: new Date() })
                    .where(eq(bookingsTable.id, parseInt(bookingId, 10)));
            }
            break;
        }
        default:
            console.log(`Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
});

export default router;
