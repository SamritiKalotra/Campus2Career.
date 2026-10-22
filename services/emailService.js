// const nodemailer = require('nodemailer');

// // ─── Transporter ──────────────────────────────────────────────────────────────

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//   port: Number(process.env.EMAIL_PORT) || 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
//   },
// });

// console.log("EMAIL_USER loaded:", !!process.env.EMAIL_USER);
// console.log("EMAIL_PASS loaded:", !!process.env.EMAIL_PASS);
// console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
// transporter.verify(function (error, success) {
//   if (error) {
//     console.log('Email transporter error:', error);
//   } else {
//     console.log('Email server is ready to send messages');
//   }
// });

// // ─── OTP Generator ───────────────────────────────────────────────────────────
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // ─── Shared HTML wrapper ──────────────────────────────────────────────────────
// const buildEmail = (bodyHTML) => `
// <!DOCTYPE html>
// <html>
// <head>
//   <style>
//     body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
//     .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
//     .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 28px 30px; text-align: center; }
//     .header h1 { margin: 0 0 4px; font-size: 20px; }
//     .header p  { margin: 0; opacity: .85; font-size: 13px; }
//     .body   { padding: 28px 30px; color: #333; font-size: 15px; line-height: 1.6; }
//     .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }
//     .info-box table { width: 100%; border-collapse: collapse; }
//     .info-box td { padding: 7px 0; font-size: 14px; }
//     .info-box td:first-child { color: #64748b; width: 140px; }
//     .info-box td:last-child  { color: #1e293b; font-weight: 600; }
//     .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg,#667eea,#764ba2); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 14px; font-size: 14px; }
//     .tip  { font-size: 13px; color: #64748b; margin-top: 18px; padding: 12px 16px; background: #f8fafc; border-radius: 6px; }
//     .footer { text-align: center; padding: 18px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>🎓 Campus2Career</h1>
//     </div>
//     <div class="body">${bodyHTML}</div>
//     <div class="footer">© ${new Date().getFullYear()} Campus2Career. All rights reserved.</div>
//   </div>
// </body>
// </html>`;

// // ─── OTP Email ────────────────────────────────────────────────────────────────
// const sendOTPEmail = async (email, name, otp) => {
//   const html = buildEmail(`
//     <h2>Hello ${name}!</h2>
//     <p>Use the OTP below to complete your Campus2Career login:</p>
//     <div style="background:#f0f4ff;border:2px dashed #667eea;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
//       <p style="margin:0;font-size:13px;color:#666;">Your One-Time Password</p>
//       <div style="font-size:32px;font-weight:bold;color:#667eea;letter-spacing:8px;margin:10px 0;">${otp}</div>
//       <p style="margin:0;font-size:12px;color:#666;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
//     </div>
//     <p style="color:#e74c3c;font-size:13px;">⚠️ Never share this OTP with anyone.</p>
//   `);

//   try {
//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: email,
//       subject: 'Your Campus2Career Login OTP',
//       html,
//     });
//     console.log('OTP Email sent:', info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//     return { success: false, error: error.message };
//   }
// };

// // ─── Welcome Email ────────────────────────────────────────────────────────────
// const sendWelcomeEmail = async (email, name, role) => {
//   const features = role === 'student'
//     ? '<li>Browse internship opportunities</li><li>Apply with one click</li><li>Track your application status</li><li>Build your professional profile</li>'
//     : '<li>Post internship opportunities</li><li>Review candidate applications</li><li>Shortlist and connect with talent</li><li>Access analytics and reports</li>';

//   const html = buildEmail(`
//     <h2>Hi ${name}! 👋</h2>
//     <p>Welcome to Campus2Career as a <strong>${role}</strong>!</p>
//     <ul>${features}</ul>
//     <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" class="btn">Login Now</a>
//   `);

//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: email,
//       subject: 'Welcome to Campus2Career! 🎉',
//       html,
//     });
//     console.log('Welcome email sent to:', email);
//   } catch (error) {
//     console.error('Error sending welcome email:', error);
//   }
// };

// // ─── NEW: Company notified when student applies ───────────────────────────────
// const sendNewApplicationEmail = async (companyEmail, companyName, studentName, studentEmail, internshipTitle) => {
//   console.log(`📧 Sending new-application email to company: ${companyEmail}`);

//   const html = buildEmail(`
//     <h2>New Application Received 📬</h2>
//     <p>Hi <strong>${companyName}</strong>, a student has applied for your internship on Campus2Career.</p>
//     <div class="info-box">
//       <table>
//         <tr><td>Internship</td><td>${internshipTitle}</td></tr>
//         <tr><td>Student Name</td><td>${studentName}</td></tr>
//         <tr><td>Student Email</td><td>${studentEmail}</td></tr>
//         <tr><td>Applied On</td><td>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
//       </table>
//     </div>
//     <p>Log in to review the application, view the student's profile and resume, and update the status.</p>
//     <a href="${process.env.APP_URL || 'http://localhost:3000'}/applicants" class="btn">Review Application →</a>
//   `);

//   try {
//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: companyEmail,
//       subject: `New Application: ${studentName} applied for "${internshipTitle}"`,
//       html,
//     });
//     console.log('✅ New-application email sent to company:', info.messageId);
//     return { success: true };
//   } catch (error) {
//     console.error('❌ Error sending new-application email:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// // ─── NEW: Student notified when status changes ────────────────────────────────
// const sendApplicationStatusEmail = async (studentEmail, studentName, internshipTitle, companyName, newStatus) => {
//   console.log(`📧 Sending status-update email to student: ${studentEmail} — status: ${newStatus}`);

//   const configs = {
//     shortlisted: {
//       subject:  `🎉 You've been shortlisted for "${internshipTitle}"`,
//       headline: '🎉 Congratulations — You\'re Shortlisted!',
//       color:    '#10b981',
//       bgColor:  '#dcfce7',
//       message:  `Great news! <strong>${companyName}</strong> has shortlisted your application for <strong>${internshipTitle}</strong>. They are interested in your profile and will be in touch with next steps.`,
//       tip:      '💡 Keep an eye on your email for further communication from the company.',
//     },
//     rejected: {
//       subject:  `Application Update for "${internshipTitle}"`,
//       headline: '📋 Application Status Update',
//       color:    '#64748b',
//       bgColor:  '#f1f5f9',
//       message:  `Thank you for applying to <strong>${internshipTitle}</strong> at <strong>${companyName}</strong>. After careful review, the company has decided to move forward with other candidates at this time.`,
//       tip:      '💡 Don\'t be discouraged — keep applying! There are many more opportunities on Campus2Career.',
//     },
//     pending: {
//       subject:  `Your application for "${internshipTitle}" is under review`,
//       headline: '⏳ Application Under Review',
//       color:    '#f59e0b',
//       bgColor:  '#fef3c7',
//       message:  `Your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> is currently under review. We\'ll notify you as soon as there\'s an update.`,
//       tip:      '💡 While you wait, explore more internships on Campus2Career!',
//     },
//   };

//   const cfg = configs[newStatus.toLowerCase()] || {
//     subject:  `Application Update — "${internshipTitle}"`,
//     headline: '📬 Application Status Updated',
//     color:    '#667eea',
//     bgColor:  '#ede9fe',
//     message:  `Your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> has been updated. New status: <strong>${newStatus}</strong>.`,
//     tip:      'Log in to your dashboard to see more details.',
//   };

//   const html = buildEmail(`
//     <h2>${cfg.headline}</h2>
//     <p>Hi <strong>${studentName}</strong>,</p>
//     <p>${cfg.message}</p>
//     <div class="info-box" style="border-left: 4px solid ${cfg.color}; background: ${cfg.bgColor};">
//       <table>
//         <tr><td>Internship</td><td>${internshipTitle}</td></tr>
//         <tr><td>Company</td><td>${companyName}</td></tr>
//         <tr><td>Status</td><td><span style="background:${cfg.color};color:#fff;padding:2px 12px;border-radius:99px;font-size:12px;font-weight:700;">${newStatus.toUpperCase()}</span></td></tr>
//         <tr><td>Updated On</td><td>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
//       </table>
//     </div>
//     <div class="tip">${cfg.tip}</div>
//     <a href="${process.env.APP_URL || 'http://localhost:3000'}/student-applications" class="btn">View My Applications →</a>
//   `);

//   try {
//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: studentEmail,
//       subject: cfg.subject,
//       html,
//     });
//     console.log('✅ Status-update email sent to student:', info.messageId);
//     return { success: true };
//   } catch (error) {
//     console.error('❌ Error sending status-update email:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// // ─── Exports ──────────────────────────────────────────────────────────────────
// module.exports = {
//   generateOTP,
//   sendOTPEmail,
//   sendWelcomeEmail,
//   sendNewApplicationEmail,
//   sendApplicationStatusEmail,
// };

const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
  },
});

console.log("EMAIL_USER loaded:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASS loaded:", !!process.env.EMAIL_PASS);
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email transporter error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// ─── OTP Generator ───────────────────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
const buildEmail = (bodyHTML) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 28px 30px; text-align: center; }
    .header h1 { margin: 0 0 4px; font-size: 20px; }
    .header p  { margin: 0; opacity: .85; font-size: 13px; }
    .body   { padding: 28px 30px; color: #333; font-size: 15px; line-height: 1.6; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 7px 0; font-size: 14px; }
    .info-box td:first-child { color: #64748b; width: 140px; }
    .info-box td:last-child  { color: #1e293b; font-weight: 600; }
    .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg,#667eea,#764ba2); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 14px; font-size: 14px; }
    .tip  { font-size: 13px; color: #64748b; margin-top: 18px; padding: 12px 16px; background: #f8fafc; border-radius: 6px; }
    .footer { text-align: center; padding: 18px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Campus2Career</h1>
    </div>
    <div class="body">${bodyHTML}</div>
    <div class="footer">© ${new Date().getFullYear()} Campus2Career. All rights reserved.</div>
  </div>
</body>
</html>`;

// ─── OTP Email ────────────────────────────────────────────────────────────────
const sendOTPEmail = async (email, name, otp) => {
  const html = buildEmail(`
    <h2>Hello ${name}!</h2>
    <p>Use the OTP below to complete your Campus2Career login:</p>
    <div style="background:#f0f4ff;border:2px dashed #667eea;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#666;">Your One-Time Password</p>
      <div style="font-size:32px;font-weight:bold;color:#667eea;letter-spacing:8px;margin:10px 0;">${otp}</div>
      <p style="margin:0;font-size:12px;color:#666;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
    </div>
    <p style="color:#e74c3c;font-size:13px;">⚠️ Never share this OTP with anyone.</p>
  `);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Campus2Career Login OTP',
      html,
    });
    console.log('OTP Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, name, role) => {
  const features = role === 'student'
    ? '<li>Browse internship opportunities</li><li>Apply with one click</li><li>Track your application status</li><li>Build your professional profile</li>'
    : '<li>Post internship opportunities</li><li>Review candidate applications</li><li>Shortlist and connect with talent</li><li>Access analytics and reports</li>';

  const html = buildEmail(`
    <h2>Hi ${name}! 👋</h2>
    <p>Welcome to Campus2Career as a <strong>${role}</strong>!</p>
    <ul>${features}</ul>
    <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" class="btn">Login Now</a>
  `);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Campus2Career! 🎉',
      html,
    });
    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// ─── NEW: Company notified when student applies ───────────────────────────────
const sendNewApplicationEmail = async (companyEmail, companyName, studentName, studentEmail, internshipTitle) => {
  console.log(`📧 Sending new-application email to company: ${companyEmail}`);

  const html = buildEmail(`
    <h2>New Application Received 📬</h2>
    <p>Hi <strong>${companyName}</strong>, a student has applied for your internship on Campus2Career.</p>
    <div class="info-box">
      <table>
        <tr><td>Internship</td><td>${internshipTitle}</td></tr>
        <tr><td>Student Name</td><td>${studentName}</td></tr>
        <tr><td>Student Email</td><td>${studentEmail}</td></tr>
        <tr><td>Applied On</td><td>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      </table>
    </div>
    <p>Log in to review the application, view the student's profile and resume, and update the status.</p>
    <a href="${process.env.APP_URL || 'http://localhost:3000'}/applicants" class="btn">Review Application →</a>
  `);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: companyEmail,
      subject: `New Application: ${studentName} applied for "${internshipTitle}"`,
      html,
    });
    console.log('✅ New-application email sent to company:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending new-application email:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── NEW: Student notified when status changes ────────────────────────────────
const sendApplicationStatusEmail = async (studentEmail, studentName, internshipTitle, companyName, newStatus) => {
  console.log(`📧 Sending status-update email to student: ${studentEmail} — status: ${newStatus}`);

  const configs = {
    shortlisted: {
      subject:  `🎉 You've been shortlisted for "${internshipTitle}"`,
      headline: '🎉 Congratulations — You\'re Shortlisted!',
      color:    '#10b981',
      bgColor:  '#dcfce7',
      message:  `Great news! <strong>${companyName}</strong> has shortlisted your application for <strong>${internshipTitle}</strong>. They are interested in your profile and will be in touch with next steps.`,
      tip:      '💡 Keep an eye on your email for further communication from the company.',
    },
    rejected: {
      subject:  `Application Update for "${internshipTitle}"`,
      headline: '📋 Application Status Update',
      color:    '#64748b',
      bgColor:  '#f1f5f9',
      message:  `Thank you for applying to <strong>${internshipTitle}</strong> at <strong>${companyName}</strong>. After careful review, the company has decided to move forward with other candidates at this time.`,
      tip:      '💡 Don\'t be discouraged — keep applying! There are many more opportunities on Campus2Career.',
    },
    pending: {
      subject:  `Your application for "${internshipTitle}" is under review`,
      headline: '⏳ Application Under Review',
      color:    '#f59e0b',
      bgColor:  '#fef3c7',
      message:  `Your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> is currently under review. We\'ll notify you as soon as there\'s an update.`,
      tip:      '💡 While you wait, explore more internships on Campus2Career!',
    },
  };

  const cfg = configs[newStatus.toLowerCase()] || {
    subject:  `Application Update — "${internshipTitle}"`,
    headline: '📬 Application Status Updated',
    color:    '#667eea',
    bgColor:  '#ede9fe',
    message:  `Your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> has been updated. New status: <strong>${newStatus}</strong>.`,
    tip:      'Log in to your dashboard to see more details.',
  };

  const html = buildEmail(`
    <h2>${cfg.headline}</h2>
    <p>Hi <strong>${studentName}</strong>,</p>
    <p>${cfg.message}</p>
    <div class="info-box" style="border-left: 4px solid ${cfg.color}; background: ${cfg.bgColor};">
      <table>
        <tr><td>Internship</td><td>${internshipTitle}</td></tr>
        <tr><td>Company</td><td>${companyName}</td></tr>
        <tr><td>Status</td><td><span style="background:${cfg.color};color:#fff;padding:2px 12px;border-radius:99px;font-size:12px;font-weight:700;">${newStatus.toUpperCase()}</span></td></tr>
        <tr><td>Updated On</td><td>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
      </table>
    </div>
    <div class="tip">${cfg.tip}</div>
    <a href="${process.env.APP_URL || 'http://localhost:3000'}/student-applications" class="btn">View My Applications →</a>
  `);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: studentEmail,
      subject: cfg.subject,
      html,
    });
    console.log('✅ Status-update email sent to student:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending status-update email:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendNewApplicationEmail,
  sendApplicationStatusEmail,
};