const mongoose = require("mongoose");

const InternshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: String,
  department: String,
  location: String,
  duration: String,
  stipend: String,
  type: String,
  description: String,
  requirements: [String],
  postedDate: Date,
  status: String,
  skills: [String],
  deadline: Date,
  viewsCount: { type: Number, default: 0 },
  updatedDate: Date,
  statusUpdatedDate: Date,
  applicationsCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("Internship", InternshipSchema);