const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

// ─── AUTH MIDDLEWARE (local, used only within this file) ──────────────────────
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
};

// GET /signup
router.get('/signup', (req, res) => {
    res.render('signup', { error: null, msg: null });
});

// POST /signup

router.post('/signup', async (req, res) => {
    console.log("SIGNUP ROUTE HIT");
    console.log("Form fields:", Object.keys(req.body || {}));

    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.render('signup', {
                error: 'All fields are required',
                msg: null
            });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.redirect(
                '/login?msg=Email already registered, please login'
            );
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hash,
            role
        });

        console.log("USER SAVED:", newUser._id);

        sendWelcomeEmail(email, name, role).catch(err => {
            console.log("Welcome email failed:", err.message);
        });

        return res.redirect(
            '/login?msg=Signup successful! Please login to continue'
        );

    } catch (err) {
        console.error("SIGNUP ERROR:", err);

        return res.render('signup', {
            error: 'Something went wrong! Please try again.',
            msg: null
        });
    }
});

// GET /login
router.get('/login', (req, res) => {
    const msg = req.query.msg || null;
    res.render('login', { error: null, msg });
});

// POST /login — Step 1: validate credentials, send OTP
router.post('/login', async (req, res) => {
    try {
         console.log("LOGIN ROUTE HIT");
        const { email, password } = req.body;
        if (!email || !password) {
            return res.render('login', { error: 'Email & Password required', msg: null });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid credentials', msg: null });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'Invalid credentials', msg: null });
        }

        // Generate and save OTP
        const otp = generateOTP();
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
        user.otpVerified = false;
        await user.save();

                console.log('DEV OTP for', email, ':', otp);
        
const emailResult = await sendOTPEmail(email, user.name, otp);

if (!emailResult.success) {
    console.error('OTP EMAIL ERROR:', emailResult.error);

    return res.render('login', {
        error: `OTP email failed: ${emailResult.error || 'Unknown error'}`,
        msg: null
    });
}

return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
}

         catch (err) {
        console.error(err);
        res.render('login', { error: 'Something went wrong! Please try again.', msg: null });
    }
});

// GET /verify-otp
router.get('/verify-otp', (req, res) => {
    const email = req.query.email;
    if (!email) return res.redirect('/login');
    res.render('verify-otp', { email, error: null, msg: null });
});

// POST /verify-otp — Step 2: verify OTP, issue JWT, redirect by role
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.render('verify-otp', { email, error: 'Email and OTP are required', msg: null });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('verify-otp', { email, error: 'User not found', msg: null });
        }

        if (!user.isOTPValid(otp)) {
            return res.render('verify-otp', {
                email,
                error: 'Invalid or expired OTP. Please request a new one.',
                msg: null
            });
        }

        // Clear OTP
        user.clearOTP();
        await user.save();

        // Issue JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

        // Redirect by role
        if (user.role === 'student') return res.redirect('/student-dashboard');
        if (user.role === 'company') return res.redirect('/dashboard');
        return res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('verify-otp', {
            email: req.body.email,
            error: 'Something went wrong! Please try again.',
            msg: null
        });
    }
});

// POST /resend-otp

router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({
                success: false,
                error: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                error: 'User not found'
            });
        }

        const otp = generateOTP();
        const otpExpiryMinutes =
            parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

        user.otp = otp;
        user.otpExpires = new Date(
            Date.now() + otpExpiryMinutes * 60 * 1000
        );
        user.otpVerified = false;

        await user.save();

        const emailResult = await sendOTPEmail(
            email,
            user.name,
            otp
        );

        if (!emailResult.success) {
            console.error('OTP SEND FAILED:', emailResult.error);

            return res.json({
                success: false,
                error: `Email failed: ${emailResult.error || 'Unknown error'}`
            });
        }

        return res.json({
            success: true,
            message: 'New OTP sent to your email!'
        });

    } catch (err) {
        console.error('RESEND OTP ERROR:', err);

        return res.json({
            success: false,
            error: 'Something went wrong! Please try again.'
        });
    }
});


// POST /logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});


// POST /api/auth/signup
router.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hash, role });

        sendWelcomeEmail(email, name, role).catch(err =>
            console.log('Welcome email failed:', err.message)
        );

        return res.status(201).json({
            success: true,
            message: 'Signup successful! Please login to continue',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Something went wrong! Please try again.' });
    }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email & Password required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

        const otp = generateOTP();
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
        user.otpVerified = false;
        await user.save();

        const emailResult = await sendOTPEmail(email, user.name, otp);
        if (!emailResult.success) {
            return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
        }

        return res.json({
            success: true,
            message: 'OTP sent to your email',
            email,
            ...(process.env.NODE_ENV !== 'production' && { otp }), // dev only
            expiresIn: `${otpExpiryMinutes} minutes`
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Something went wrong! Please try again.' });
    }
});

// POST /api/auth/verify-otp
router.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        if (!user.isOTPValid(otp)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        user.clearOTP();
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            expiresIn: '24 hours'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Something went wrong! Please try again.' });
    }
});

// POST /api/auth/resend-otp
router.post('/api/auth/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const otp = generateOTP();
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
        user.otpVerified = false;
        await user.save();

        const emailResult = await sendOTPEmail(email, user.name, otp);
        if (!emailResult.success) {
            return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
        }

        return res.json({
            success: true,
            message: 'New OTP sent to your email!',
            ...(process.env.NODE_ENV !== 'production' && { otp }), // dev only
            expiresIn: `${otpExpiryMinutes} minutes`
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Something went wrong! Please try again.' });
    }
});

module.exports = router;