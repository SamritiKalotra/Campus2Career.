const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Internship = require('../../models/Internship');
const Application = require('../../models/Application');
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
    await Internship.deleteMany({});
    await Application.deleteMany({});
    await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Internship Model', () => {
    test('creates a valid internship with required title', async () => {
        const internship = await Internship.create({
            title: 'Frontend Developer Intern',
            company: 'TechCorp',
            department: 'Engineering',
            location: 'Remote',
            duration: '3 months',
            description: 'Work on React apps',
            status: 'active',
        });
        expect(internship._id).toBeDefined();
        expect(internship.title).toBe('Frontend Developer Intern');
        expect(internship.applicationsCount).toBe(0); // default
    });

    test('fails to create internship without title', async () => {
        await expect(
            Internship.create({ company: 'Test Co', location: 'Delhi' })
        ).rejects.toThrow();
    });

    test('applicationsCount defaults to 0', async () => {
        const internship = await Internship.create({ title: 'ML Intern' });
        expect(internship.applicationsCount).toBe(0);
    });

    test('can store requirements and skills as arrays', async () => {
        const internship = await Internship.create({
            title: 'Backend Intern',
            requirements: ['Node.js', 'MongoDB'],
        });
        expect(internship.requirements).toEqual(['Node.js', 'MongoDB']);
    });

    test('finds internships by status', async () => {
        await Internship.create({ title: 'Active Role', status: 'active' });
        await Internship.create({ title: 'Closed Role', status: 'closed' });
        const active = await Internship.find({ status: 'active' });
        expect(active.length).toBe(1);
        expect(active[0].title).toBe('Active Role');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Application Model', () => {
    let student, internship;

    beforeEach(async () => {
        student = await User.create({
            name: 'Test Student',
            email: 'student@test.com',
            password: 'pass',
            role: 'student',
        });
        internship = await Internship.create({ title: 'Test Internship' });
    });

    test('creates a valid application with defaults', async () => {
        const app = await Application.create({
            internshipId: internship._id,
            studentId: student._id,
            coverLetter: 'I am very interested.',
        });
        expect(app._id).toBeDefined();
        expect(app.status).toBe('pending');       // default
        expect(app.coverLetter).toBe('I am very interested.');
        expect(app.appliedDate).toBeDefined();
        expect(app.reviewedAt).toBeNull();         // default
    });

    test('status defaults to pending', async () => {
        const app = await Application.create({
            internshipId: internship._id,
            studentId: student._id,
        });
        expect(app.status).toBe('pending');
    });

    test('coverLetter defaults to empty string', async () => {
        const app = await Application.create({
            internshipId: internship._id,
            studentId: student._id,
        });
        expect(app.coverLetter).toBe('');
    });

    test('can update status to accepted', async () => {
        const app = await Application.create({
            internshipId: internship._id,
            studentId: student._id,
        });
        app.status = 'accepted';
        await app.save();
        const updated = await Application.findById(app._id);
        expect(updated.status).toBe('accepted');
    });

    test('finds all applications for a student', async () => {
        await Application.create({ internshipId: internship._id, studentId: student._id });
        await Application.create({ internshipId: internship._id, studentId: student._id });
        const apps = await Application.find({ studentId: student._id });
        expect(apps.length).toBe(2);
    });
});
