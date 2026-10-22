const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { requireAuth, requireCompany } = require('../middleware/auth');

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateAnalyticsData(internships, applications) {
    const now = new Date();
    const departmentStats = {};
    internships.forEach(i => {
        departmentStats[i.department] = (departmentStats[i.department] || 0) + 1;
    });

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().substr(0, 7);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData.push({
            month: monthName,
            internships: internships.filter(i =>
                i.postedDate && i.postedDate.toISOString().startsWith(monthKey)
            ).length,
            applications: applications.filter(a =>
                a.appliedDate && a.appliedDate.toISOString().startsWith(monthKey)
            ).length
        });
    }

    return {
        summary: {
            totalInternships: internships.length,
            totalApplications: applications.length,
            activeInternships: internships.filter(i => i.status === 'active').length,
            avgApplicationsPerInternship: internships.length > 0
                ? (applications.length / internships.length).toFixed(1) : 0
        },
        departmentStats,
        monthlyTrends: monthlyData,
        statusBreakdown: {
            pending: applications.filter(a => a.status === 'pending').length,
            shortlisted: applications.filter(a => a.status === 'shortlisted').length,
            rejected: applications.filter(a => a.status === 'rejected').length
        },
        topPerformingInternships: internships.map(i => {
            const count = applications.filter(a =>
                a.internshipId?.toString() === i._id?.toString()
            ).length;
            return {
                title: i.title, department: i.department, applications: count,
                conversionRate: count > 0 ? (
                    applications.filter(a =>
                        a.internshipId?.toString() === i._id?.toString() && a.status === 'shortlisted'
                    ).length / count * 100
                ).toFixed(1) : 0
            };
        }).sort((a, b) => b.applications - a.applications).slice(0, 5),
        recentActivity: {
            newInternshipsLastWeek: internships.filter(i =>
                new Date(i.postedDate) >= new Date(Date.now() - 7 * 86400000)
            ).length,
            newApplicationsLastWeek: applications.filter(a =>
                new Date(a.appliedDate) >= new Date(Date.now() - 7 * 86400000)
            ).length
        }
    };
}

function generateReport(type, { internships, applications }) {
    switch (type) {
        case 'internships':
            return {
                title: 'Internships Report', data: internships,
                summary: {
                    total: internships.length,
                    active: internships.filter(i => i.status === 'active').length,
                    closed: internships.filter(i => i.status === 'closed').length
                }
            };
        case 'applications':
            return {
                title: 'Applications Report', data: applications,
                summary: {
                    total: applications.length,
                    pending: applications.filter(a => a.status === 'pending').length,
                    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
                    rejected: applications.filter(a => a.status === 'rejected').length
                }
            };
        case 'performance':
            const performanceData = internships.map(i => {
                const apps = applications.filter(a =>
                    a.internshipId?.toString() === i._id?.toString()
                );
                return {
                    title: i.title, department: i.department,
                    totalApplications: apps.length,
                    shortlisted: apps.filter(a => a.status === 'shortlisted').length,
                    conversionRate: apps.length > 0
                        ? (apps.filter(a => a.status === 'shortlisted').length / apps.length * 100).toFixed(1)
                        : 0
                };
            });
            return {
                title: 'Performance Report', data: performanceData,
                summary: {
                    avgConversionRate: performanceData.length > 0
                        ? (performanceData.reduce((sum, p) => sum + parseFloat(p.conversionRate), 0) / performanceData.length).toFixed(1)
                        : 0
                }
            };
        default:
            return { title: 'Unknown Report Type', data: [], summary: {} };
    }
}

router.get('/dashboard', requireAuth, requireCompany, async (req, res) => {
    try {
        const internships = await Internship.find();
        const applications = await Application.find();
        res.json(generateAnalyticsData(internships, applications));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});


router.get('/export', requireAuth, requireCompany, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        if (!['json', 'csv'].includes(format)) {
            return res.status(400).json({ error: 'Invalid format. Use json or csv.' });
        }

        const internships = await Internship.find();
        const applications = await Application.find();
        const timestamp = new Date().toISOString().split('T')[0];

        if (format === 'csv') {
            let csv = 'Type,ID,Title,Department,Status,Date,Location,Duration,Stipend\n';
            internships.forEach(i => {
                csv += `Internship,"${i._id}","${i.title}","${i.department}","${i.status}","${i.postedDate}","${i.location}","${i.duration}","${i.stipend}"\n`;
            });
            applications.forEach(a => {
                csv += `Application,"${a._id}","${a.studentId}","","${a.status}","${a.appliedDate}","","",""\n`;
            });

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="export-${timestamp}.csv"`);
            return res.send(csv);
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="export-${timestamp}.json"`);
        return res.json({
            exportInfo: { exportDate: new Date().toISOString(), exportedBy: req.user.id },
            internships,
            applications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to export data' });
    }
});

// GET /api/analytics/reports?type=internships|applications|performance&startDate=&endDate=
router.get('/reports', requireAuth, requireCompany, async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        let internshipQuery = {};
        let applicationQuery = {};

        if (startDate && endDate) {
            internshipQuery.postedDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            applicationQuery.appliedDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const internships = await Internship.find(internshipQuery);
        const applications = await Application.find(applicationQuery);
        res.json(generateReport(type, { internships, applications }));
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;