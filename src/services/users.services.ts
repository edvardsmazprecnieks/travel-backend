import argon2 from 'argon2';
import { db } from '../db/db.js';
import { eq, sql } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import { type SelectUser, usersTable } from '../db/schema.js';
import { generateAccessToken } from '../utils/jwt.utils.js';

type RegisterData = Pick<InferInsertModel<typeof usersTable>, 'email'> & {
    password?: string;
};

type UserWithoutPassword = Omit<SelectUser, 'passwordHash'>;

export const createUser = async (userData: RegisterData): Promise<UserWithoutPassword> => {
    const { email, password } = userData;

    if (!password) {
        throw new Error('Password is required to create a user.');
    }

    const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
    });
    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
    });

    const [newUser] = await db
        .insert(usersTable)
        .values({ email, passwordHash, createdAt: new Date(), status: 'ACTIVE' })
        .returning();

    if (!newUser) {
        throw new Error('Insert failed');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

type LoginData = Pick<InferInsertModel<typeof usersTable>, 'email'> & {
    password: string;
};

export const loginUser = async (loginData: LoginData): Promise<UserWithoutPassword> => {
    const { email, password } = loginData;

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
    });

    const emailPasswordErrorMessage = 'Invalid email or password.';

    if (!user) {
        throw new Error(emailPasswordErrorMessage);
    }

    const isPasswordCorrect = await argon2.verify(user.passwordHash, password);
    if (!isPasswordCorrect) {
        throw new Error(emailPasswordErrorMessage);
    }

    if (user.status === 'DISABLED') {
        throw new Error('This account has been disabled.');
    }

    if (user.status === 'UNVERIFIED') {
        throw new Error('Please verify your email before logging in.');
    }

    const [updatedUser] = await db
        .update(usersTable)
        .set({ lastLoginAt: new Date() })
        .where(eq(usersTable.id, user.id))
        .returning();

    if (!updatedUser) {
        throw new Error('Failed to update login timestamp.');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

export const findUserByID = async (id: number): Promise<UserWithoutPassword> => {
    const foundUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });

    if (!foundUser) {
        throw new Error(`User with id nr. ${id} is not found.`);
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
};

export const findUserByEmail = async (email: string): Promise<UserWithoutPassword> => {
    const foundUser = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });

    if (!foundUser) {
        throw new Error(`User with given email is not found.`);
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
};

export const saveRefreshToken = async (
    userId: number,
    token: string,
): Promise<UserWithoutPassword> => {
    const [updatedUser] = await db
        .update(usersTable)
        .set({ refreshToken: token })
        .where(eq(usersTable.id, userId))
        .returning();

    if (!updatedUser) {
        throw new Error('Failed to remove refresh token.');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

export const getRefreshToken = async (userId: number): Promise<string | null> => {
    const foundUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
        columns: { refreshToken: true },
    });
    return foundUser?.refreshToken ?? null;
};

export const findUserByRefreshToken = async (token: string): Promise<UserWithoutPassword> => {
    const foundUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.refreshToken, token),
    });

    if (!foundUser) {
        throw new Error(`User with given token is not found.`);
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
};

export const clearTokens = async (userId: number): Promise<UserWithoutPassword> => {
    const [updatedUser] = await db
        .update(usersTable)
        .set({ accessTokenVersion: sql`${usersTable.accessTokenVersion} + 1`, refreshToken: null })
        .where(eq(usersTable.id, userId))
        .returning();

    if (!updatedUser) {
        throw new Error('Failed to remove refresh token.');
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

export const refreshAccessToken = async (token: string): Promise<{ accessToken: string }> => {
    const foundUser = await findUserByRefreshToken(token);

    if (!foundUser) {
        throw new Error('User not found or refresh token is invalid');
    }

    if (foundUser.status !== 'ACTIVE') {
        await clearTokens(foundUser.id);
        throw new Error('User account is not active.');
    }

    const newAccessToken = generateAccessToken(foundUser.id, foundUser.accessTokenVersion);

    return { accessToken: newAccessToken };
};
