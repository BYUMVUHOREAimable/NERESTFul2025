
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateToken } = require('../config/auth');
const { generateVerificationCode } = require('../utils/helpers');
const { renderEmailTemplate } = require('../utils/renderEmailTemplate');
const { RoleName } = require('@prisma/client'); 

const registerStaff = async (req, res) => {
  try {
    
    const { firstName, lastName, email, password, roleName } = req.body;

    
    const validationErrors = [];
    if (!firstName || firstName.trim().length === 0) validationErrors.push("First name is required.");
    if (!lastName || lastName.trim().length === 0) validationErrors.push("Last name is required.");
    if (!email) validationErrors.push("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) validationErrors.push("Invalid email format."); 
    if (!password) validationErrors.push("Password is required.");
    else if (password.length < 8) validationErrors.push("Password must be at least 8 characters.");

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }
   

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by another staff member.' });
    }

    let targetRoleId = null;
   
    if (roleName) {
      const roleEnumKey = Object.keys(RoleName).find(key => RoleName[key] === roleName.toUpperCase());
      if (!roleEnumKey) {
        return res.status(400).json({ message: `Invalid role specified: ${roleName}.` });
      }
      const role = await prisma.role.findUnique({ where: { name: RoleName[roleEnumKey] } });
      if (!role) return res.status(400).json({ message: `Role '${roleName}' not found.` });
      targetRoleId = role.id;
    } else {
      
      const defaultRole = await prisma.role.findUnique({ where: { name: RoleName.PARKING_ATTENDANT } });
      if (!defaultRole) return res.status(500).json({ message: "Default staff role not configured." });
      targetRoleId = defaultRole.id;
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role_id: targetRoleId,
        email_verified: false, 
        email_verification_code: verificationCode,
      },
    });

    const htmlEmail = renderEmailTemplate('verificationEmail', { 
      name: `${newUser.firstName} ${newUser.lastName}`,
      verificationCode: verificationCode,
    });

    if (htmlEmail) {
      await sendEmail(
        email,
        'Verify Your XYZ LTD PMS Staff Account',
        `Your XYZ LTD PMS staff account verification code is: ${verificationCode}`,
        htmlEmail
      );
    } else {
      console.error("Could not render staff verification email template for:", email);
      
    }

    
    res.status(201).json({
      message: 'Staff account created. Please check email for verification code.',
      userId: newUser.id
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ message: 'Server error during staff registration' });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Staff account not found' });
    if (user.email_verified) return res.status(400).json({ message: 'Email already verified' });
    if (user.email_verification_code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { email_verified: true, email_verification_code: null },
    });
    
    res.status(200).json({ message: 'Staff email verified successfully' });
  } catch (error) {
    console.error('Staff email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { select: { name: true } } }, 
    });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email first.' });
    }

    
    if (user.role.name !== RoleName.ADMIN && user.role.name !== RoleName.PARKING_ATTENDANT) {
      return res.status(403).json({ message: 'Access denied. Not a staff account.' });
    }

    const token = generateToken({
      user_id: user.id,
      role_id: user.role_id, 
      role_name: user.role.name,
      firstName: user.firstName 
    });
   
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


const getCurrentUser = async (req, res) => { 
  try {
    const userId = req.user.user_id; 
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        email_verified: true,
        role: {
          select: {
            name: true,
            permissions: { 
              select: { permission: { select: { name: true } } }
            }
          }
        },
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Staff user not found' });
    }

    
    const permissions = user.role.permissions.map(rp => rp.permission.name);

    res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.name,
      email_verified: user.email_verified,
      permissions, 
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get current staff user error:', error);
    res.status(500).json({ message: 'Server error retrieving staff information' });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || (user.role_id && !(await prisma.role.findUnique({ where: { id: user.role_id } }))?.name.startsWith("ADMIN") && !(await prisma.role.findUnique({ where: { id: user.role_id } }))?.name.startsWith("PARKING_ATTENDANT"))) {
      
      return res.status(200).json({ message: 'If your email is registered as a staff account, you will receive a password reset OTP.' });
    }

    const otp = generateVerificationCode();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 
    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token: otp, reset_token_expires: otpExpires },
    });

    const htmlEmail = renderEmailTemplate('passwordResetOtpEmail', { 
      name: `${user.firstName}`,
      otp: otp,
    });

    if (htmlEmail) {
      await sendEmail(
        email, 'XYZ LTD PMS Staff Password Reset OTP',
        `Your password reset OTP is: ${otp}. Valid for 10 minutes.`, htmlEmail
      );
    }
    // logAction removed
    res.status(200).json({ message: 'If your email is registered, you will receive a password reset OTP.' });
  } catch (error) {
    console.error('Staff forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp_code, newPassword } = req.body;
    if (!email || !otp_code || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
   
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

    const user = await prisma.user.findFirst({
      where: { email, reset_token: otp_code, reset_token_expires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, reset_token: null, reset_token_expires: null },
    });
   
    res.status(200).json({ message: 'Staff password has been reset successfully' });
  } catch (error) {
    console.error('Staff reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};


module.exports = {
  registerStaff, 
  verifyEmail,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};