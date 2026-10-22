const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');

const Internship  = require('../models/Internship');
const Application = require('../models/Application');

// ── Import auth middleware ────────────────────────────────────────────────────
// requireAuth reads the JWT cookie and sets req.user  — needed to save createdBy
const { requireAuthApi: requireAuth } = require('../middleware/auth');
const requireCompanyApi = (req, res, next) =>
    req.user.role === 'company' ? next() : res.status(403).json({ success: false, error: 'Company access only' });

// Loads the internship and makes sure the logged-in company owns it
async function loadOwned(req, res, next) {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) return res.status(404).json({ success: false, error: 'Internship not found' });
        if (String(internship.createdBy) !== String(req.user.id)) {
            return res.status(403).json({ success: false, error: 'You can only modify your own internships' });
        }
        req.internship = internship;
        next();
    } catch (e) {
        res.status(400).json({ success: false, error: 'Invalid internship id' });
    }
}

// ─── GET / ────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        let internships = await Internship.find();
        const { search, department, status, location, limit = 10, page = 1 } = req.query;

        if (search) {
            const s = search.toLowerCase();
            internships = internships.filter(i =>
                (i.title       || '').toLowerCase().includes(s) ||
                (i.description || '').toLowerCase().includes(s)
            );
        }
        if (department) internships = internships.filter(i => (i.department || '').toLowerCase() === department.toLowerCase());
        if (status)     internships = internships.filter(i => i.status === status);
        if (location)   internships = internships.filter(i => (i.location || '').toLowerCase().includes(location.toLowerCase()));

        const startIndex = (page - 1) * limit;
        const paginated  = internships.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: paginated,
            pagination: {
                currentPage:  parseInt(page),
                totalPages:   Math.ceil(internships.length / limit),
                totalItems:   internships.length,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── GET /stats/summary ───────────────────────────────────────────────────────
router.get('/stats/summary', async (req, res) => {
    try {
        const internships  = await Internship.find();
        const applications = await Application.find();

        const stats = {
            totalInternships:        internships.length,
            activeInternships:       internships.filter(i => i.status === 'active').length,
            closedInternships:       internships.filter(i => i.status === 'closed').length,
            draftInternships:        internships.filter(i => i.status === 'draft').length,
            totalApplications:       applications.length,
            pendingApplications:     applications.filter(a => a.status === 'pending').length,
            shortlistedApplications: applications.filter(a => a.status === 'shortlisted').length,
            rejectedApplications:    applications.filter(a => a.status === 'rejected').length,
            departmentBreakdown: {},
            monthlyPosting: {}
        };

        internships.forEach(i => {
            stats.departmentBreakdown[i.department] = (stats.departmentBreakdown[i.department] || 0) + 1;
        });

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date     = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().substr(0, 7);
            stats.monthlyPosting[monthKey] = internships.filter(i =>
                i.postedDate && i.postedDate.toISOString().startsWith(monthKey)
            ).length;
        }

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) return res.status(404).json({ success: false, error: 'Internship not found' });
        res.json({ success: true, data: internship });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── POST / — CREATE internship ───────────────────────────────────────────────
// requireAuth ensures req.user is set so we can save createdBy correctly
router.post('/', requireAuth, requireCompanyApi, async (req, res) => {
    try {
        const requiredFields = ['title', 'department', 'location', 'duration', 'description'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ success: false, error: `${field} is required` });
            }
        }

        const newInternship = new Internship({
            title:             req.body.title,
            company:           req.body.company           || '',
            department:        req.body.department,
            location:          req.body.location,
            duration:          req.body.duration,
            stipend:           req.body.stipend           || 'Not specified',
            type:              req.body.type              || 'Full-time',
            description:       req.body.description,
            requirements:      req.body.requirements      || [],
            skills:            req.body.skills            || [],
            postedDate:        new Date(),
            deadline:          req.body.deadline          || null,
            status:            'active',
            applicationsCount: 0,
            viewsCount:        0,

            // ✅ THE FIX: always save the logged-in user's ID as createdBy
            // req.user.id is set by requireAuth from the JWT cookie
            createdBy: req.user.id
        });

        await newInternship.save();
        console.log(`✅ Internship created: "${newInternship.title}" | createdBy: ${req.user.id} (${req.user.email})`);

        res.status(201).json({
            success: true,
            message: 'Internship created successfully',
            data:    newInternship
        });
    } catch (error) {
        console.error('Error creating internship:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, requireCompanyApi, loadOwned, async (req, res) => {
    try {
        const allowed = ['title','company','department','location','duration','stipend','type',
                         'description','requirements','skills','deadline','status'];
        const updates = { updatedDate: new Date() };
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        const internship = await Internship.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!internship) return res.status(404).json({ success: false, error: 'Internship not found' });
        res.json({ success: true, message: 'Internship updated successfully', data: internship });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireCompanyApi, loadOwned, async (req, res) => {
    try {
        const internship = await Internship.findByIdAndDelete(req.params.id);
        if (!internship) return res.status(404).json({ success: false, error: 'Internship not found' });

        await Application.deleteMany({ internshipId: req.params.id });

        res.json({ success: true, message: 'Internship and related applications deleted', data: internship });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── GET /:id/applications ────────────────────────────────────────────────────
router.get('/:id/applications', requireAuth, requireCompanyApi, loadOwned, async (req, res) => {
    try {
        const apps = await Application.find({ internshipId: req.params.id }).sort({ appliedDate: -1 });
        res.json({ success: true, data: apps, count: apps.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── PUT /:id/status ──────────────────────────────────────────────────────────
router.put('/:id/status', requireAuth, requireCompanyApi, loadOwned, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['active', 'closed', 'draft', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        const internship = await Internship.findByIdAndUpdate(
            req.params.id,
            { status, statusUpdatedDate: new Date() },
            { new: true }
        );
        if (!internship) return res.status(404).json({ success: false, error: 'Internship not found' });
        res.json({ success: true, message: `Status updated to ${status}`, data: internship });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── POST /:id/view ───────────────────────────────────────────────────────────
router.post('/:id/view', async (req, res) => {
    try {
        const internship = await Internship.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewsCount: 1 } },
            { new: true }
        );
        if (!internship) return res.status(404).json({ success: false, error: 'Internship not found' });
        res.json({ success: true, viewsCount: internship.viewsCount });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


module.exports = router;