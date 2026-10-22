// const express  = require('express');
// const router   = express.Router();
// const path     = require('path');
// const fs       = require('fs');
// const multer   = require('multer');

// const Application    = require('../models/Application');
// const Internship     = require('../models/Internship');
// const StudentProfile = require('../models/StudentProfile');
// const User           = require('../models/User');
// const { requireAuth, requireStudentApi } = require('../middleware/auth');
// const { sendNewApplicationEmail } = require('../services/emailService');

// // ─── Upload directories ───────────────────────────────────────────────────────
// const RESUME_DIR = path.join(__dirname, '..', 'uploads', 'resumes');
// const IMAGE_DIR  = path.join(__dirname, '..', 'uploads', 'profile-images');

// [RESUME_DIR, IMAGE_DIR].forEach(dir => {
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });

// // ─── Multer: Resume ───────────────────────────────────────────────────────────
// const resumeStorage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, RESUME_DIR),
//     filename:    (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}.pdf`)
// });
// const uploadResume = multer({
//     storage: resumeStorage,
//     limits: { fileSize: 5 * 1024 * 1024 },
//     fileFilter: (req, file, cb) => {
//         file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
//     }
// });

// // ─── Multer: Profile image ────────────────────────────────────────────────────
// const imageStorage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, IMAGE_DIR),
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
//         cb(null, `${req.user.id}_${Date.now()}${ext}`);
//     }
// });
// const uploadImage = multer({
//     storage: imageStorage,
//     limits: { fileSize: 3 * 1024 * 1024 },
//     fileFilter: (req, file, cb) => {
//         const allowed = ['image/jpeg', 'image/png', 'image/webp'];
//         allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG or WEBP images are allowed'));
//     }
// });

// // ─── POST /api/student/apply ──────────────────────────────────────────────────
// router.post('/apply', requireAuth, requireStudentApi, async (req, res) => {
//     try {
//         const { internshipId, coverLetter } = req.body;

//         const internship = await Internship.findById(internshipId);
//         if (!internship)
//             return res.status(404).json({ success: false, error: 'Internship not found' });

//         const hasApplied = await Application.exists({ internshipId, studentId: req.user.id });
//         if (hasApplied)
//             return res.status(400).json({ success: false, error: 'Already applied to this internship' });

//         const newApplication = new Application({
//             internshipId,
//             studentId:   req.user.id,
//             coverLetter: coverLetter || '',
//             appliedDate: new Date(),
//             status:      'pending'
//         });
//         await newApplication.save();
//         await Internship.findByIdAndUpdate(internshipId, { $inc: { applicationsCount: 1 } });

//         // Fire-and-forget — never delays the API response
//         notifyCompany(internship, req.user);

//         res.json({ success: true, message: 'Application submitted!', applicationId: newApplication._id });
//     } catch (error) {
//         console.error('Apply error:', error);
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

// // ─── Helper: email the company who owns this internship ──────────────────────
// async function notifyCompany(internship, student) {
//     try {
//         console.log(`NOTIFY COMPANY: "${internship.title}" | createdBy: ${internship.createdBy}`);

//         if (!internship.createdBy) {
//             console.warn('NOTIFY COMPANY: createdBy is empty on this internship — email skipped.');
//             console.warn('NOTE: This only affects internships created before the fix.');
//             console.warn('      All newly posted internships will work correctly.');
//             return;
//         }

//         const companyUser = await User.findById(internship.createdBy).select('name email');

//         if (!companyUser) {
//             console.warn('NOTIFY COMPANY: User not found for id:', internship.createdBy);
//             return;
//         }

//         console.log(`NOTIFY COMPANY: emailing ${companyUser.email}`);

//         await sendNewApplicationEmail(
//             companyUser.email,
//             companyUser.name,
//             student.name,
//             student.email,
//             internship.title
//         );
//     } catch (err) {
//         console.error('NOTIFY COMPANY ERROR:', err.message);
//     }
// }

// // ─── PUT /api/student/profile ─────────────────────────────────────────────────
// router.put('/profile', requireAuth, requireStudentApi, async (req, res) => {
//     try {
//         const body = { ...req.body };
//         if (typeof body.skills === 'string') {
//             body.skills = body.skills.split(',').map(s => s.trim()).filter(Boolean);
//         }
//         const profile = await StudentProfile.findOneAndUpdate(
//             { userId: req.user.id },
//             { ...body, userId: req.user.id, updatedAt: new Date() },
//             { upsert: true, new: true }
//         );
//         res.json({ success: true, message: 'Profile updated!', profile });
//     } catch (error) {
//         console.error('Profile update error:', error);
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

// // ─── POST /api/student/profile-image ─────────────────────────────────────────
// router.post('/profile-image', requireAuth, uploadImage.single('profileImage'), async (req, res) => {
//     try {
//         if (!req.file)
//             return res.status(400).json({ success: false, error: 'No image uploaded' });

//         const existing = await StudentProfile.findOne({ userId: req.user.id });
//         if (existing && existing.profileImage) {
//             const oldPath = path.join(IMAGE_DIR, existing.profileImage);
//             if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//         }

//         await StudentProfile.findOneAndUpdate(
//             { userId: req.user.id },
//             { userId: req.user.id, profileImage: req.file.filename, profileImageUpdatedAt: new Date() },
//             { upsert: true, new: true }
//         );

//         res.json({ success: true, message: 'Profile image updated!', fileName: req.file.filename, url: `/uploads/profile-images/${req.file.filename}` });
//     } catch (error) {
//         console.error('Image upload error:', error);
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

// // ─── POST /api/student/resume ─────────────────────────────────────────────────
// router.post('/resume', requireAuth, uploadResume.single('resume'), async (req, res) => {
//     try {
//         if (!req.file)
//             return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const existing = await StudentProfile.findOne({ userId: req.user.id });
//         if (existing && existing.resume) {
//             const oldPath = path.join(RESUME_DIR, existing.resume);
//             if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//         }

//         await StudentProfile.findOneAndUpdate(
//             { userId: req.user.id },
//             { userId: req.user.id, resume: req.file.filename, resumeOrigName: req.file.originalname, resumeUpdatedAt: new Date() },
//             { upsert: true, new: true }
//         );

//         res.json({ success: true, message: 'Resume uploaded!', fileName: req.file.filename, origName: req.file.originalname });
//     } catch (error) {
//         console.error('Resume upload error:', error);
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

// // ─── GET /api/student/resume/download ────────────────────────────────────────
// router.get('/resume/download', requireAuth, requireStudentApi, async (req, res) => {
//     try {
//         const profile = await StudentProfile.findOne({ userId: req.user.id });
//         if (!profile || !profile.resume)
//             return res.status(404).json({ success: false, error: 'No resume found' });

//         const filePath = path.join(RESUME_DIR, profile.resume);
//         if (!fs.existsSync(filePath))
//             return res.status(404).json({ success: false, error: 'Resume file not found on server' });

//         res.download(filePath, profile.resumeOrigName || profile.resume);
//     } catch (error) {
//         console.error('Resume download error:', error);
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

// // ─── GET /api/student/dashboard ───────────────────────────────────────────────
// router.get('/dashboard', requireAuth, requireStudentApi, async (req, res) => {
//     try {
//         const applications = await Application.find({ studentId: req.user.id });
//         const availableInternships = await Internship.countDocuments({ status: 'active' });

//         res.json({
//             success: true,
//             stats: {
//                 totalApplications: applications.length,
//                 shortlisted: applications.filter(a => a.status === 'shortlisted').length,
//                 pending:     applications.filter(a => a.status === 'pending').length,
//                 rejected:    applications.filter(a => a.status === 'rejected').length
//             },
//             availableInternships,
//             recentApplications: applications.slice(-3).reverse()
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, error: 'Server error' });
//     }
// });

// module.exports = router;




const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const Application    = require('../models/Application');
const Internship     = require('../models/Internship');
const StudentProfile = require('../models/StudentProfile');
const User           = require('../models/User');
const { requireAuth, requireStudentApi } = require('../middleware/auth');
const { sendNewApplicationEmail } = require('../services/emailService');

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer: Profile Image → Cloudinary ──────────────────────────────────────
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder:          'campus2career/profile-images',
        public_id:       `${req.user.id}_${Date.now()}`,
        resource_type:   'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation:  [{ width: 400, height: 400, crop: 'fill' }],
    }),
});
const uploadImage = multer({
    storage: imageStorage,
    limits:  { fileSize: 3 * 1024 * 1024 },
});

// ─── Multer: Resume PDF → Cloudinary ─────────────────────────────────────────
// const resumeStorage = new CloudinaryStorage({
//     cloudinary,
//     params: async (req, file) => ({
//         folder:        'campus2career/resumes',
//         public_id:     `${req.user.id}_${Date.now()}`,
//         resource_type: 'raw',
//         format:        'pdf',
//     }),
// });
const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder:        'campus2career/resumes',
        public_id:     `${req.user.id}_${Date.now()}`,
        resource_type: 'raw',
        format:        'pdf',
        type:          'upload',    // ← makes it publicly accessible
        access_mode:   'public',    // ← ensures public access
    }),
});
const uploadResume = multer({
    storage: resumeStorage,
    limits:  { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        file.mimetype === 'application/pdf'
            ? cb(null, true)
            : cb(new Error('Only PDF files are allowed'));
    },
});

// ─── POST /api/student/apply ──────────────────────────────────────────────────
router.post('/apply', requireAuth, requireStudentApi, async (req, res) => {
    try {
        const { internshipId, coverLetter } = req.body;

        const internship = await Internship.findById(internshipId);
        if (!internship)
            return res.status(404).json({ success: false, error: 'Internship not found' });

        const hasApplied = await Application.exists({ internshipId, studentId: req.user.id });
        if (hasApplied)
            return res.status(400).json({ success: false, error: 'Already applied to this internship' });

        const newApplication = new Application({
            internshipId,
            studentId:   req.user.id,
            coverLetter: coverLetter || '',
            appliedDate: new Date(),
            status:      'pending'
        });
        await newApplication.save();
        await Internship.findByIdAndUpdate(internshipId, { $inc: { applicationsCount: 1 } });

        notifyCompany(internship, req.user);

        res.json({ success: true, message: 'Application submitted!', applicationId: newApplication._id });
    } catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── Helper: email the company ────────────────────────────────────────────────
async function notifyCompany(internship, student) {
    try {
        if (!internship.createdBy) return;
        const companyUser = await User.findById(internship.createdBy).select('name email');
        if (!companyUser) return;
        await sendNewApplicationEmail(
            companyUser.email, companyUser.name,
            student.name, student.email, internship.title
        );
    } catch (err) {
        console.error('NOTIFY COMPANY ERROR:', err.message);
    }
}

// ─── PUT /api/student/profile ─────────────────────────────────────────────────
router.put('/profile', requireAuth, requireStudentApi, async (req, res) => {
    try {
        const allowed = ['fullName','phone','university','major','graduationYear','gpa','location',
                         'about','skills','experience','projects','linkedin','github'];
        const body = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) body[k] = req.body[k]; });
        if (typeof body.skills === 'string') {
            body.skills = body.skills.split(',').map(s => s.trim()).filter(Boolean);
        }
        const profile = await StudentProfile.findOneAndUpdate(
            { userId: req.user.id },
            { ...body, userId: req.user.id, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: 'Profile updated!', profile });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── POST /api/student/profile-image ─────────────────────────────────────────
router.post('/profile-image', requireAuth, uploadImage.single('profileImage'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, error: 'No image uploaded' });

        // Delete old image from Cloudinary
        const existing = await StudentProfile.findOne({ userId: req.user.id });
        if (existing?.profileImagePublicId) {
            await cloudinary.uploader.destroy(existing.profileImagePublicId, { resource_type: 'image' });
        }

        await StudentProfile.findOneAndUpdate(
            { userId: req.user.id },
            {
                userId:               req.user.id,
                profileImage:         req.file.path,      // full Cloudinary URL
                profileImagePublicId: req.file.filename,  // for future deletion
                profileImageUpdatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Profile image updated!', url: req.file.path });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── POST /api/student/resume ─────────────────────────────────────────────────
router.post('/resume', requireAuth, uploadResume.single('resume'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, error: 'No file uploaded' });

        // Delete old resume from Cloudinary
        const existing = await StudentProfile.findOne({ userId: req.user.id });
        if (existing?.resumePublicId) {
            // await cloudinary.uploader.destroy(existing.resumePublicId, { resource_type: 'raw' });
            await cloudinary.uploader.destroy(existing.resumePublicId, { resource_type: 'raw' });
        }

        // await StudentProfile.findOneAndUpdate(
        //     { userId: req.user.id },
        //     {
        //         userId:         req.user.id,
        //         resume:         req.file.path,                        // full Cloudinary URL
        //         resumePublicId: req.file.filename,                    // for future deletion
        //         resumeOrigName: req.file.originalname || 'resume.pdf',
        //         resumeUpdatedAt: new Date()
        //     },
        //     { upsert: true, new: true }
        // );

        //res.json({ success: true, message: 'Resume uploaded!', url: req.file.path });

        // Build a clean public URL manually

await StudentProfile.findOneAndUpdate(
    { userId: req.user.id },
    {
        userId:         req.user.id,
        resume:         req.file.path,          // Cloudinary URL
        resumePublicId: req.file.filename,
        resumeOrigName: req.file.originalname || 'resume.pdf',
        resumeUpdatedAt: new Date()
    },
    { upsert: true, new: true }
);

res.json({ success: true, message: 'Resume uploaded!', url: req.file.path });
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ─── GET /api/student/dashboard ───────────────────────────────────────────────
router.get('/dashboard', requireAuth, requireStudentApi, async (req, res) => {
    try {
        const applications = await Application.find({ studentId: req.user.id });
        const availableInternships = await Internship.countDocuments({ status: 'active' });

        res.json({
            success: true,
            stats: {
                totalApplications: applications.length,
                shortlisted: applications.filter(a => a.status === 'shortlisted').length,
                pending:     applications.filter(a => a.status === 'pending').length,
                rejected:    applications.filter(a => a.status === 'rejected').length
            },
            availableInternships,
            recentApplications: applications.slice(-3).reverse()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;