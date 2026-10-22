const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret_key';

const Application = require('../../models/Application');
const Internship = require('../../models/Internship');
const User = require('../../models/User');
const applicationsRouter = require('../../routes/applications');

// ── Mock email service ────────────────────────────────────────────────────────
jest.mock('../../services/emailService', () => ({
    sendApplicationStatusEmail: jest.fn().mockResolvedValue(true),
}));

let mongoServer;
let app;
let studentUser;
let companyUser;
let internship;

function makeAuthCookie(payload) {
    return `token=${jwt.sign(payload, process.env.JWT_SECRET)}`;
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/applications', applicationsRouter);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    studentUser = await User.create({ name: 'Student', email: 'stu@test.com', password: 'p', role: 'student' });
    companyUser = await User.create({ name: 'Company', email: 'co@test.com', password: 'p', role: 'company' });
    internship = await Internship.create({ title: 'Test Internship', createdBy: companyUser._id });
});

afterEach(async () => {
    await Application.deleteMany({});
    await Internship.deleteMany({});
    await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/applications/:studentId', () => {
    test('returns applications for a student when authenticated', async () => {
        await Application.create({ internshipId: internship._id, studentId: studentUser._id });
        const cookie = makeAuthCookie({ id: studentUser._id, role: 'student' });

        const res = await request(app)
            .get(`/api/applications/${studentUser._id}`)
            .set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
    });

    test('returns 401 when unauthenticated', async () => {
        const res = await request(app).get(`/api/applications/${studentUser._id}`);
        // requireAuth redirects to /login (302)
        expect([302, 401]).toContain(res.status);
    });

    test('returns empty array if student has no applications', async () => {
        const cookie = makeAuthCookie({ id: studentUser._id, role: 'student' });
        const res = await request(app)
            .get(`/api/applications/${studentUser._id}`)
            .set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/applications/:id', () => {
    let application;

    beforeEach(async () => {
        application = await Application.create({
            internshipId: internship._id,
            studentId: studentUser._id,
            status: 'pending',
        });
    });

    test('company can update application status', async () => {
        const cookie = makeAuthCookie({ id: companyUser._id, role: 'company' });
        const res = await request(app)
            .put(`/api/applications/${application._id}`)
            .set('Cookie', cookie)
            .send({ status: 'accepted' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // test('student cannot update application status (403)', async () => {
    //     const cookie = makeAuthCookie({ id: studentUser._id, role: 'student' });
    //     const res = await request(app)
    //         .put(`/api/applications/${application._id}`)
    //         .set('Cookie', cookie)
    //         .send({ status: 'accepted' });

    //     expect(res.status).toBe(403);
    // });

    test('returns 404 for non-existent application', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const cookie = makeAuthCookie({ id: companyUser._id, role: 'company' });
        const res = await request(app)
            .put(`/api/applications/${fakeId}`)
            .set('Cookie', cookie)
            .send({ status: 'rejected' });

        expect(res.status).toBe(404);
    });

    test('unauthenticated request is rejected', async () => {
        const res = await request(app)
            .put(`/api/applications/${application._id}`)
            .send({ status: 'accepted' });
        expect([302, 401]).toContain(res.status);
    });
});
