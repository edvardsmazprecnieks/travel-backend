import { describe, expect, test, beforeAll } from 'vitest';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    verifyAccessToken,
} from '../../utils/jwt.utils.js';

beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'testing-access-secret';
    process.env.JWT_REFRESH_SECRET = 'testing-refresh-secret';
});

describe('generateAccessToken, verifyAccessToken', () => {
    test('generate and verify accessToken retrieving userId and tokenVersion', () => {
        const token = generateAccessToken(77, 4);
        const payload = verifyAccessToken(token);
        expect(payload?.userId).toBe(77);
        expect(payload?.tokenVersion).toBe(4);
    });
    test('tampered accessToken fails', () => {
        const token = generateAccessToken(84, 6);
        expect(() => verifyAccessToken(token + 'iTamperedWithThis')).toThrow();
    });
});

describe('generateRefreshToken, verifyRefreshToken', () => {
    test('generate and verify refreshToken retrieving userId', () => {
        const token = generateRefreshToken(78);
        const payload = verifyRefreshToken(token);
        expect(payload?.userId).toBe(78);
    });
    test('returns null for invalid token', () => {
        const payload = verifyRefreshToken('notARealRefreshToken');
        expect(payload).toBeNull();
    });
});
