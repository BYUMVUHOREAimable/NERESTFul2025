// config/email.js
const nodemailer = require('nodemailer');

// Configure your email transport (e.g., using Gmail, SendGrid, Mailgun)
// For Gmail, you might need to enable "Less secure app access" or use an App Password
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email', // Example: 'smtp.gmail.com'
  port: parseInt(process.env.EMAIL_PORT || "587"), // Example: 587 or 465
  secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS,
  },
  // For Ethereal, to prevent self-signed certificate errors in some environments
  ...(process.env.EMAIL_HOST === 'smtp.ethereal.email' && {
    tls: {
 rejectUnauthorized: process.env.NODE_ENV !== 'production'    }
  })
});

/**
 * Sends an email.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text body of the email.
 * @param {string} html - HTML body of the email.
 * @returns {Promise<object>} Promise resolving with info about the sent message.
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `"Parking Management System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    // For Ethereal, log the preview URL
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error)
  {
    console.error('Error sending email:', error);
    throw error; // Re-throw to be handled by caller
  }
};

// // Example: Create a test account with Ethereal if you don't have SMTP
// // (async () => {
// //   if (!process.env.EMAIL_USER && !process.env.EMAIL_PASS && process.env.EMAIL_HOST === 'smtp.ethereal.email') {
// //     let testAccount = await nodemailer.createTestAccount();
// //     console.log("Ethereal test account created:");
// //     console.log("User: %s", testAccount.user);
// //     console.log("Pass: %s", testAccount.pass);
// //     console.log("Host: %s", testAccount.smtp.host);
// //     console.log("Port: %s", testAccount.smtp.port);
// //     console.log("Secure: %s", testAccount.smtp.secure);
// //     // You can set these as environment variables for testing
// //     // process.env.EMAIL_USER = testAccount.user;
// //     // process.env.EMAIL_PASS = testAccount.pass;
// //   }
// // })();


module.exports = { sendEmail, transporter };