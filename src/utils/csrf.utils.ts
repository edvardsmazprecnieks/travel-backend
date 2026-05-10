import { doubleCsrf } from 'csrf-csrf';

export const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET!,
    getSessionIdentifier: (req) => req.cookies['refreshToken'] ?? '',
    cookieName: '__Host-csrf-token',
    cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req) =>
        req.body._csrf ||
        (req.headers['x-csrf-token'] as string) ||
        (req.headers['csrf-token'] as string),
});
