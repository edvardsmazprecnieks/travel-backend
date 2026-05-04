import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import usersRoutes from './routes/users.routes.ts';
import bookingRoutes from './routes/booking.routes.ts';
import { searchFlightsController } from './controllers/flightSearch.controllers.ts';
import webhook from './routes/webhook.ts';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

await migrate(db, { migrationsFolder: './migrations' });

const app = express();
const port = process.env.PORT || 3000;

//fix cors when frontend deployed
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }),
);

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: process.env.NODE_ENV === 'production' ? 'same-origin' : 'cross-origin',
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"],
                frameAncestors: ["'none'"],
            },
        },
        hsts:
            process.env.NODE_ENV === 'production'
                ? { maxAge: 31536000, includeSubDomains: true, preload: true }
                : false,
    }),
);

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

app.use('/api', webhook);
app.use(express.json()); // parse JSON bodies
app.use(cookieParser());

app.use('/api/user', usersRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/flights', searchFlightsController);

Sentry.setupExpressErrorHandler(app);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
