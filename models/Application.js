const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    coverLetter:  { type: String, default: '' },
    status:       { type: String, default: 'pending' },
    appliedDate:  { type: Date, default: Date.now },
    reviewedAt:   { type: Date, default: null }
});

module.exports = mongoose.model("Application", ApplicationSchema);