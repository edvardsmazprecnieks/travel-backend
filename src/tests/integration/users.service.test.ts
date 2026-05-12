import { describe, test, expect, afterEach } from 'vitest';
import { createUser } from '../../services/users.services.js';
import { db } from '../../db/db.js';
import { usersTable } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = `test-${Date.now()}@example.com`;

afterEach(async () => {
    await db.delete(usersTable).where(eq(usersTable.email, TEST_EMAIL));
});

describe('createUser', () => {
    test('creates a user and tests that sensitive data are stripped', async () => {
        const user = await createUser({
            email: TEST_EMAIL,
            password: 'My!SuperSecureTestP@ssword123',
        });
        expect(user.email).toBe(TEST_EMAIL);
        expect(Number.isInteger(user.id)).toBe(true);
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('status');
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('refreshToken');
    });

    test('tries creating user with same email', async () => {
        await createUser({ email: TEST_EMAIL, password: 'My!SuperSecureTestP@ssword123' });
        await expect(
            createUser({ email: TEST_EMAIL, password: 'MyDifferentSecureP@ssword123' }),
        ).rejects.toThrow('User with this email already exists');
    });
});
