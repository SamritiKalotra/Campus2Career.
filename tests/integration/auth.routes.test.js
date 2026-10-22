const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

// Set env vars before requiring anything that reads them
process.env.JWT_SECRET = 'test_secret_key';
process.env.OTP_EXPIRY_MINUTES = '10';

const User = require('../../models/User');
const authRouter = require('../../routes/auth');

// ── Mock email service so no real emails are sent ────────────────────────────
jest.mock('../../services/emailService', () => ({
    generateOTP: jest.fn(() => '123456'),
    sendOTPEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Stub EJS render so tests don't need view files
    app.set('view engine', 'ejs');
    app.use((req, res, next) => {
        res.render = (view, data) => res.json({ view, ...data });
        next();
    });

    app.use('/', authRouter);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /signup', () => {
    test('creates user and redirects to /login on success', async () => {
        const res = await request(app).post('/signup').send({
            name: 'Alice',
            email: 'alice@test.com',
            password: 'secret123',
            role: 'student',
        });
        expect(res.status).toBe(302);
        expect(res.headers.location).toContain('/login');

        const user = await User.findOne({ email: 'alice@test.com' });
        expect(user).not.toBeNull();
        expect(user.name).toBe('Alice');
    });

    test('renders signup with error if a field is missing', async () => {
        const res = await request(app).post('/signup').send({
            email: 'missing@test.com',
            password: 'pass',
            // name and role missing
        });
        expect(res.status).toBe(200);
        expect(res.body.view).toBe('signup');
        expect(res.body.error).toBeTruthy();
    });

    test('redirects to /login if email already registered', async () => {
        await User.create({
            name: 'Existing',
            email: 'exists@test.com',
            password: 'hash',
            role: 'student',
        });
        const res = await request(app).post('/signup').send({
            name: 'New User',
            email: 'exists@test.com',
            password: 'pass',
            role: 'student',
        });
        expect(res.status).toBe(302);
        expect(res.headers.location).toContain('/login');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /login', () => {
    beforeEach(async () => {
        const hash = await bcrypt.hash('password123', 10);
        await User.create({
            name: 'Bob',
            email: 'bob@test.com',
            password: hash,
            role: 'company',
        });
    });

    // test('redirects to /verify-otp on valid credentials', async () => {
    //     const res = await request(app).post('/login').send({
    //         email: 'bob@test.com',
    //         password: 'password123',
    //     });
    //     expect(res.status).toBe(302);
    //     expect(res.headers.location).toContain('/verify-otp');
    // });

    test('renders login with error on wrong password', async () => {
        const res = await request(app).post('/login').send({
            email: 'bob@test.com',
            password: 'wrongpass',
        });
        expect(res.status).toBe(200);
        expect(res.body.view).toBe('login');
        expect(res.body.error).toMatch(/invalid credentials/i);
    });

    test('renders login with error on unknown email', async () => {
        const res = await request(app).post('/login').send({
            email: 'ghost@test.com',
            password: 'pass',
        });
        expect(res.status).toBe(200);
        expect(res.body.view).toBe('login');
        expect(res.body.error).toMatch(/invalid credentials/i);
    });

    test('renders login with error if fields are missing', async () => {
        const res = await request(app).post('/login').send({ email: 'bob@test.com' });
        expect(res.status).toBe(200);
        expect(res.body.view).toBe('login');
        expect(res.body.error).toBeTruthy();
    });
});
