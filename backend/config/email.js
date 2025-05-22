
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({ 
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || "587"), 
  secure: process.env.EMAIL_SECURE === 'true' || false, 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
  
  ...(process.env.EMAIL_HOST === 'smtp.ethereal.email' && {
    tls: {
 rejectUnauthorized: process.env.NODE_ENV !== 'production'    }
  })
});


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
   
    if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error)
  {
    console.error('Error sending email:', error);
    throw error; 
  }
};


module.exports = { sendEmail, transporter };