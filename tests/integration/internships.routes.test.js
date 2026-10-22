const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret_key';

const Internship = require('../../models/Internship');
const User = require('../../models/User');
const internshipsRouter = require('../../routes/internships');

let mongoServer;
let app;
let companyToken;
let companyUser;

// Helper to create a signed JWT cookie
function makeAuthCookie(payload) {
    return `token=${jwt.sign(payload, process.env.JWT_SECRET)}`;
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/internships', internshipsRouter);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    companyUser = await User.create({
        name: 'Test Company',
        email: 'co@test.com',
        password: 'hash',
        role: 'company',
    });
    companyToken = makeAuthCookie({ id: companyUser._id, role: 'company' });
});

afterEach(async () => {
    await Internship.deleteMany({});
    await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/internships', () => {
    test('returns empty list when no internships exist', async () => {
        const res = await request(app).get('/api/internships');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
    });

    test('returns all internships', async () => {
        await Internship.create({ title: 'Role A', status: 'active' });
        await Internship.create({ title: 'Role B', status: 'active' });
        const res = await request(app).get('/api/internships');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
    });

    test('filters by search query', async () => {
        await Internship.create({ title: 'React Developer', description: 'Build UIs' });
        await Internship.create({ title: 'Data Analyst', description: 'Analyse data' });
        const res = await request(app).get('/api/internships?search=react');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].title).toBe('React Developer');
    });

    test('filters by status', async () => {
        await Internship.create({ title: 'Open', status: 'active' });
        await Internship.create({ title: 'Closed', status: 'closed' });
        const res = await request(app).get('/api/internships?status=active');
        expect(res.status).toBe(200);
        expect(res.body.data.every(i => i.status === 'active')).toBe(true);
    });

    test('paginates results', async () => {
        for (let i = 0; i < 15; i++) {
            await Internship.create({ title: `Role ${i}` });
        }
        const res = await request(app).get('/api/internships?limit=5&page=1');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(5);
        expect(res.body.pagination.totalItems).toBe(15);
        expect(res.body.pagination.totalPages).toBe(3);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/internships/:id', () => {
    test('returns internship by id', async () => {
        const internship = await Internship.create({ title: 'Specific Role' });
        const res = await request(app).get(`/api/internships/${internship._id}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Specific Role');
    });

    test('returns 404 for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/internships/${fakeId}`);
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/internships', () => {
    const validPayload = {
        title: 'Backend Intern',
        department: 'Engineering',
        location: 'Mumbai',
        duration: '2 months',
        description: 'Work on APIs',
    };

    test('creates internship when authenticated', async () => {
        const res = await request(app)
            .post('/api/internships')
            .set('Cookie', companyToken)
            .send(validPayload);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Backend Intern');
    });

    test('returns 401 when not authenticated', async () => {
        const res = await request(app).post('/api/internships').send(validPayload);
        // requireAuth will redirect to /login (302) since no token
        expect([302, 401]).toContain(res.status);
    });

    test('returns 400 when required field is missing', async () => {
        const { title, ...withoutTitle } = validPayload;
        const res = await request(app)
            .post('/api/internships')
            .set('Cookie', companyToken)
            .send(withoutTitle);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/internships/:id', () => {
    test('updates internship when authenticated', async () => {
        const internship = await Internship.create({ title: 'Old Title', createdBy: companyUser._id });
        const res = await request(app)
            .put(`/api/internships/${internship._id}`)
            .set('Cookie', companyToken)
            .send({ title: 'New Title' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('New Title');
    });

    test('returns 404 for non-existent internship', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/internships/${fakeId}`)
            .set('Cookie', companyToken)
            .send({ title: 'X' });
        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/internships/:id', () => {
    test('deletes internship when authenticated', async () => {
        const internship = await Internship.create({ title: 'To Delete', createdBy: companyUser._id });
        const res = await request(app)
            .delete(`/api/internships/${internship._id}`)
            .set('Cookie', companyToken);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const check = await Internship.findById(internship._id);
        expect(check).toBeNull();
    });
});
