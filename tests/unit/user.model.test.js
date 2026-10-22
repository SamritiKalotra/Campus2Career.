const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('User Model - Schema Validation', () => {
    test('creates a valid user with all required fields', async () => {
        const user = await User.create({
            name: 'John Doe',
            email: 'john@test.com',
            password: 'hashedpassword123',
            role: 'student',
        });
        expect(user._id).toBeDefined();
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john@test.com');
        expect(user.role).toBe('student');
        expect(user.otpVerified).toBe(false); // default
    });

    test('fails if required field "name" is missing', async () => {
        await expect(
            User.create({ email: 'x@x.com', password: 'pass', role: 'student' })
        ).rejects.toThrow();
    });

    test('fails if required field "email" is missing', async () => {
        await expect(
            User.create({ name: 'Test', password: 'pass', role: 'student' })
        ).rejects.toThrow();
    });

    test('fails if required field "password" is missing', async () => {
        await expect(
            User.create({ name: 'Test', email: 'x@x.com', role: 'student' })
        ).rejects.toThrow();
    });

    test('fails if role is not student or company', async () => {
        await expect(
            User.create({ name: 'Test', email: 'x@x.com', password: 'pass', role: 'admin' })
        ).rejects.toThrow();
    });

    test('enforces unique email constraint', async () => {
        await User.create({ name: 'A', email: 'dup@test.com', password: 'pass', role: 'student' });
        await expect(
            User.create({ name: 'B', email: 'dup@test.com', password: 'pass', role: 'company' })
        ).rejects.toThrow();
    });

    test('accepts role = company', async () => {
        const user = await User.create({
            name: 'Acme Corp',
            email: 'acme@corp.com',
            password: 'pass',
            role: 'company',
        });
        expect(user.role).toBe('company');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('User Model - isOTPValid method', () => {
    test('returns true when OTP matches and is not expired', async () => {
        const user = await User.create({
            name: 'OTP Test',
            email: 'otp@test.com',
            password: 'pass',
            role: 'student',
            otp: '123456',
            otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        });
        expect(user.isOTPValid('123456')).toBe(true);
    });

    test('returns false when OTP is wrong', async () => {
        const user = await User.create({
            name: 'OTP Test 2',
            email: 'otp2@test.com',
            password: 'pass',
            role: 'student',
            otp: '123456',
            otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        });
        expect(user.isOTPValid('999999')).toBe(false);
    });

    test('returns false when OTP is expired', async () => {
        const user = await User.create({
            name: 'OTP Test 3',
            email: 'otp3@test.com',
            password: 'pass',
            role: 'student',
            otp: '123456',
            otpExpires: new Date(Date.now() - 1000), // already expired
        });
        expect(user.isOTPValid('123456')).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('User Model - clearOTP method', () => {
    test('clears OTP fields and sets otpVerified to true', async () => {
        const user = await User.create({
            name: 'Clear Test',
            email: 'clear@test.com',
            password: 'pass',
            role: 'student',
            otp: '654321',
            otpExpires: new Date(Date.now() + 5 * 60 * 1000),
        });
        user.clearOTP();
        expect(user.otp).toBeUndefined();
        expect(user.otpExpires).toBeUndefined();
        expect(user.otpVerified).toBe(true);
    });
});
