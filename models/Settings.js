const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  siteName: String,
  adminEmail: String,
  allowStudentSignup: Boolean,
  allowCompanySignup: Boolean,
  maintenanceMode: Boolean
});

module.exports = mongoose.model("Settings", SettingsSchema);