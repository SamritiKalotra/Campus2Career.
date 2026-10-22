const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.redirect('/login');
    }
};

const requireAuthApi = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};

const requireCompany = (req, res, next) => {
    if (req.user.role !== 'company') return res.redirect('/login');
    next();
};

const requireStudent = (req, res, next) => {
    if (req.user.role !== 'student') return res.redirect('/login');
    next();
};

const requireStudentApi = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
};

module.exports = { requireAuth, requireAuthApi, requireCompany, requireStudent, requireStudentApi };