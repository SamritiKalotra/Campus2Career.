const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Personal Info
    fullName:       { type: String, default: '' },
    phone:          { type: String, default: '' },
    university:     { type: String, default: '' },
    major:          { type: String, default: '' },
    graduationYear: { type: String, default: '' },
    gpa:            { type: String, default: '' },
    location:       { type: String, default: '' },
    about:          { type: String, default: '' },

    // Skills & Experience
    skills:     { type: [String], default: [] },
    experience: { type: String, default: '' },
    projects:   { type: String, default: '' },

    // Social Links
    linkedin: { type: String, default: '' },
    github:   { type: String, default: '' },

    // // Profile Image
    // profileImage:          { type: String, default: '' },  // stored filename
    // profileImageUpdatedAt: { type: Date },

    // // Resume
    // resume:          { type: String, default: '' },
    // resumeOrigName:  { type: String, default: '' },
    // resumeUpdatedAt: { type: Date },

    // Profile Image
    profileImage:          { type: String, default: '' },  // Cloudinary URL
    profileImagePublicId:  { type: String, default: '' },  // for deletion
    profileImageUpdatedAt: { type: Date },

    // Resume
    resume:          { type: String, default: '' },  // Cloudinary URL
    resumePublicId:  { type: String, default: '' },  // for deletion
    resumeOrigName:  { type: String, default: '' },
    resumeUpdatedAt: { type: Date },

    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);