const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'company'], required: true },
  
  otp: { type: String },
  otpExpires: { type: Date },
  otpVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.isOTPValid = function(inputOTP) {
  return this.otp === inputOTP && this.otpExpires > new Date();
};

userSchema.methods.clearOTP = function() {
  this.otp = undefined;
  this.otpExpires = undefined;
  this.otpVerified = true;
};

module.exports = mongoose.model('User', userSchema);