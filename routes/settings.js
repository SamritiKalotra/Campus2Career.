const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const IntegrationConfig = require('../models/IntegrationConfig');
const { requireAuth, requireCompany } = require('../middleware/auth');

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET /api/settings
router.get('/', requireAuth, requireCompany, async (req, res) => {
    try {
        const settings = await Settings.findOne() || {};
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings
router.put('/', requireAuth, requireCompany, async (req, res) => {
    try {
        if (req.body.adminEmail && !isValidEmail(req.body.adminEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        const settings = await Settings.findOneAndUpdate(
            {},
            { ...req.body, lastUpdated: new Date() },
            { new: true, upsert: true }
        );
        res.json({ success: true, message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// POST /api/settings/reset
router.post('/reset', requireAuth, requireCompany, async (req, res) => {
    try {
        const defaultSettings = {
            siteName: '',
            adminEmail: '',
            allowStudentSignup: true,
            allowCompanySignup: true,
            maintenanceMode: false
        };
        await Settings.findOneAndUpdate({}, defaultSettings, { upsert: true });
        res.json({ success: true, message: 'Settings reset to defaults successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reset settings' });
    }
});

// GET /api/settings/backup
router.get('/backup', requireAuth, requireCompany, async (req, res) => {
    try {
        const settings = await Settings.findOne() || {};
        const integrationConfigs = await IntegrationConfig.find();
        const timestamp = new Date().toISOString().split('T')[0];

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="settings-backup-${timestamp}.json"`);
        res.json({
            backupInfo: { createdDate: new Date().toISOString(), version: '1.0', createdBy: req.user.id },
            settings,
            integrationConfigs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create backup' });
    }
});

// GET /api/settings/integrations/:key
router.get('/integrations/:key', requireAuth, requireCompany, async (req, res) => {
    try {
        const config = await IntegrationConfig.findOne({ serviceName: req.params.key }) || {};
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get integration config' });
    }
});

// PUT /api/settings/integrations/:key
router.put('/integrations/:key', requireAuth, requireCompany, async (req, res) => {
    try {
        const { clientId, clientSecret, webhookUrl } = req.body;
        if (!clientId && !clientSecret && !webhookUrl) {
            return res.status(400).json({ success: false, message: 'At least one field is required' });
        }
        await IntegrationConfig.findOneAndUpdate(
            { serviceName: req.params.key },
            {
                serviceName: req.params.key,
                apiKey: clientId,
                config: { clientSecret, webhookUrl },
                enabled: true
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: `${req.params.key} integration configured successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save integration config' });
    }
});

// POST /api/settings/notifications/test
router.post('/notifications/test', requireAuth, requireCompany, async (req, res) => {
    try {
        console.log('Test notification triggered by user:', req.user.id);
        res.json({ success: true, message: 'Test notification triggered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send test notification' });
    }
});

module.exports = router;