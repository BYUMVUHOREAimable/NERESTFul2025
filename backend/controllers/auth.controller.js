// controllers/auth.controller.js
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateToken } = require('../config/auth'); // Using our simplified token generation
const { sendEmail } = require('../config/email');
const { generateVerificationCode } = require('../utils/helpers'); // For OTPs
const { renderEmailTemplate } = require('../utils/renderEmailTemplate');
const { RoleName } = require('@prisma/client'); // To access RoleName.PARKING_ATTENDANT etc.

/**
 * Registers a new staff user (Attendant or potentially Admin by another Admin).
 * This function might be called by an Admin creating other staff, or if you implement self-registration for staff.
 * Defaults to PARKING_ATTENDANT role if roleName is not specified by an Admin.
 * New users will be email_verified: false by default (as per schema).
 */
const registerStaff = async (req, res) => {
  try {
    // Admin creating staff might provide roleName. If self-registration, default or fixed role.
    const { firstName, lastName, email, password, roleName } = req.body;

    // --- Basic Validation (enhance with production rules from previous discussion) ---
    const validationErrors = [];
    if (!firstName || firstName.trim().length === 0) validationErrors.push("First name is required.");
    if (!lastName || lastName.trim().length === 0) validationErrors.push("Last name is required.");
    if (!email) validationErrors.push("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) validationErrors.push("Invalid email format."); // Simple regex
    if (!password) validationErrors.push("Password is required.");
    else if (password.length < 8) validationErrors.push("Password must be at least 8 characters."); // Adjust as needed

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }
    // --- End Validation ---

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by another staff member.' });
    }

    let targetRoleId = null;
    // Determine role: If an Admin is creating this user, they might specify roleName.
    // For a generic staff registration, you might default to PARKING_ATTENDANT.
    if (roleName) {
      const roleEnumKey = Object.keys(RoleName).find(key => RoleName[key] === roleName.toUpperCase());
      if (!roleEnumKey) {
        return res.status(400).json({ message: `Invalid role specified: ${roleName}.` });
      }
      const role = await prisma.role.findUnique({ where: { name: RoleName[roleEnumKey] } });
      if (!role) return res.status(400).json({ message: `Role '${roleName}' not found.` });
      targetRoleId = role.id;
    } else {
      // Default to PARKING_ATTENDANT if no roleName is provided (e.g., for a general staff sign-up)
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
        email_verified: false, // New staff accounts need verification
        email_verification_code: verificationCode,
      },
    });

    const htmlEmail = renderEmailTemplate('verificationEmail', { // Use your existing verification template
      name: `${newUser.firstName} ${newUser.lastName}`, // Or just firstName
      verificationCode: verificationCode,
    });

    if (htmlEmail) {
      await sendEmail(
        email,
        'Verify Your ParkWell Staff Account',
        `Your ParkWell staff account verification code is: ${verificationCode}`,
        htmlEmail
      );
    } else {
      console.error("Could not render staff verification email template for:", email);
      // Fallback might be needed
    }

    // logAction removed
    res.status(201).json({
      message: 'Staff account created. Please check email for verification code.',
      userId: newUser.id // Return ID for reference
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ message: 'Server error during staff registration' });
  }
};

/**
 * Verifies a staff user's email address.
 */
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
    // logAction removed
    res.status(200).json({ message: 'Staff email verified successfully' });
  } catch (error) {
    console.error('Staff email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

/**
 * Logs in a staff user (Admin or Parking Attendant).
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { select: { name: true } } }, // Include role name
    });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email first.' });
    }

    // Ensure the user has a staff role (ADMIN or PARKING_ATTENDANT)
    if (user.role.name !== RoleName.ADMIN && user.role.name !== RoleName.PARKING_ATTENDANT) {
      return res.status(403).json({ message: 'Access denied. Not a staff account.' });
    }

    const token = generateToken({
      user_id: user.id,
      role_id: user.role_id, // role_id is now UUID string
      role_name: user.role.name,
      firstName: user.firstName // Include firstName in token for display
    });
    // logAction removed
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

/**
 * Fetches the current authenticated staff user's details.
 */
const getCurrentUser = async (req, res) => { // Renamed from getStaffProfile for consistency
  try {
    const userId = req.user.user_id; // From JWT
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { // Select specific fields, exclude password
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        email_verified: true,
        role: {
          select: {
            name: true,
            permissions: { // Include permissions for the role
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

    // Flatten permissions
    const permissions = user.role.permissions.map(rp => rp.permission.name);

    res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.name,
      email_verified: user.email_verified,
      permissions, // Send flat array of permission names
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get current staff user error:', error);
    res.status(500).json({ message: 'Server error retrieving staff information' });
  }
};

// ForgotPassword and ResetPassword (for staff) can remain largely the same as OTP based
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || (user.role_id && !(await prisma.role.findUnique({ where: { id: user.role_id } }))?.name.startsWith("ADMIN") && !(await prisma.role.findUnique({ where: { id: user.role_id } }))?.name.startsWith("PARKING_ATTENDANT"))) {
      // Don't reveal if it's a staff email or not for security, just give generic message
      return res.status(200).json({ message: 'If your email is registered as a staff account, you will receive a password reset OTP.' });
    }

    const otp = generateVerificationCode();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token: otp, reset_token_expires: otpExpires },
    });

    const htmlEmail = renderEmailTemplate('passwordResetOtpEmail', { // Re-use OTP template
      name: `${user.firstName}`,
      otp: otp,
    });

    if (htmlEmail) {
      await sendEmail(
        email, 'ParkWell Staff Password Reset OTP',
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
    // Add stricter password validation here
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
    // logAction removed
    res.status(200).json({ message: 'Staff password has been reset successfully' });
  } catch (error) {
    console.error('Staff reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};


module.exports = {
  registerStaff, // This could be used by an admin to create staff, or a dedicated staff registration page
  verifyEmail,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};