const express = require('express');
const router  = express.Router();

const Application    = require('../models/Application');
const Internship     = require('../models/Internship');
const User           = require('../models/User');
const { requireAuth, requireCompany } = require('../middleware/auth');
const { sendApplicationStatusEmail } = require('../services/emailService');

// ─── GET /api/applications/:studentId ────────────────────────────────────────
router.get('/:studentId', requireAuth, async (req, res) => {
    try {
        // students may only read their own applications
        if (req.user.role === 'student' && String(req.user.id) !== req.params.studentId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const applications = await Application.find({ studentId: req.params.studentId })
            .populate('internshipId');
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// ─── PUT /api/applications/:id ────────────────────────────────────────────────
router.put('/:id', requireAuth, requireCompany, async (req, res) => {
    try {
        const { status } = req.body;

        // Read old status before updating
        const existing = await Application.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Application not found' });
        }
        const previousStatus = existing.status;

        // only the company that owns the internship may review its applications
        const owned = await Internship.exists({ _id: existing.internshipId, createdBy: req.user.id });
        if (!owned) return res.status(403).json({ error: 'Access denied' });

        const validStatuses = ['pending', 'shortlisted', 'rejected', 'accepted'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Update application — populate so we have student + internship data
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status, reviewedAt: new Date() },
            { new: true }
        )
        .populate('studentId',    'name email')
        .populate('internshipId', 'title createdBy');

        console.log('📋 Status update:', previousStatus, '→', status);
        console.log('   Student:', application.studentId?.email);
        console.log('   Internship:', application.internshipId?.title);

        // Send email only if status actually changed
        if (status && status !== previousStatus) {
            notifyStudent(application);
        }

        res.json({ success: true, application });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// Helper: find company name and send status email to student
async function notifyStudent(application) {
    try {
        const student    = application.studentId;
        const internship = application.internshipId;

        if (!student || !internship) {
            console.warn('⚠️  Missing student or internship on application — skipping student email');
            return;
        }

        // Get company name
        let companyName = 'The Company';
        if (internship.createdBy) {
            const companyUser = await User.findOne({
                $or: [
                    { _id: internship.createdBy },
                    { email: internship.createdBy }
                ]
            }).select('name');
            if (companyUser) companyName = companyUser.name;
        }

        console.log('🔔 Notifying student:', student.email, '| status:', application.status, '| company:', companyName);

        await sendApplicationStatusEmail(
            student.email,
            student.name,
            internship.title,
            companyName,
            application.status
        );
    } catch (err) {
        console.error('❌ notifyStudent error:', err.message);
    }
}

module.exports = router;