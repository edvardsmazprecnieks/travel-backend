export class InvalidCredentialsError extends Error {
    constructor() {
        super('Invalid credentials');
    }
}

// Then in controller:
// if (error instanceof InvalidCredentialsError) {
//    res.status(401).json({ message: 'Invalid email or password.' });
//    return;
// }
