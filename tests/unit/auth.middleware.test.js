const jwt = require('jsonwebtoken');
const { requireAuth, requireAuthApi, requireCompany, requireStudent, requireStudentApi } = require('../../middleware/auth');

// Set a test JWT secret
process.env.JWT_SECRET = 'test_secret_key';

// Helper to create mock req/res/next
function mockReqResNext(overrides = {}) {
    const req = { cookies: {}, user: null, ...overrides };
    const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
}

function makeToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET);
}

// ─────────────────────────────────────────────────────────────────────────────
describe('requireAuth middleware', () => {
    test('redirects to /login if no token in cookies', () => {
        const { req, res, next } = mockReqResNext();
        requireAuth(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('redirects to /login if token is invalid/expired', () => {
        const { req, res, next } = mockReqResNext({ cookies: { token: 'bad.token.value' } });
        requireAuth(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next() and sets req.user if token is valid', () => {
        const payload = { _id: 'user123', role: 'student', email: 'test@test.com' };
        const token = makeToken(payload);
        const { req, res, next } = mockReqResNext({ cookies: { token } });
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toMatchObject(payload);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('requireAuthApi middleware', () => {
    test('returns 401 if no token', () => {
        const { req, res, next } = mockReqResNext();
        requireAuthApi(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    });

    test('returns 401 if token is invalid', () => {
        const { req, res, next } = mockReqResNext({ cookies: { token: 'invalid' } });
        requireAuthApi(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid token' });
    });

    test('calls next() with valid token', () => {
        const token = makeToken({ _id: 'abc', role: 'company' });
        const { req, res, next } = mockReqResNext({ cookies: { token } });
        requireAuthApi(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('requireCompany middleware', () => {
    test('redirects if user is not a company', () => {
        const { req, res, next } = mockReqResNext({ user: { role: 'student' } });
        requireCompany(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next() if user is a company', () => {
        const { req, res, next } = mockReqResNext({ user: { role: 'company' } });
        requireCompany(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('requireStudent middleware', () => {
    test('redirects if user is not a student', () => {
        const { req, res, next } = mockReqResNext({ user: { role: 'company' } });
        requireStudent(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next() if user is a student', () => {
        const { req, res, next } = mockReqResNext({ user: { role: 'student' } });
        requireStudent(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('requireStudentApi middleware', () => {
    test('returns 403 if user is not a student', () => {
        const { req, res, next } = mockReqResNext({ user: { role: 'company' } });
        requireStudentApi(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Access denied' });
    });

    test('calls next() if user is a student', () => {
        const { req, res, next } = mockReqResNext({ user: { role: 'student' } });
        requireStudentApi(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
