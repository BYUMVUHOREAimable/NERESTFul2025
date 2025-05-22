// controllers/user.controller.js
const prisma = require("../config/database");
const bcrypt = require("bcrypt");
// Assuming these are still needed if email change verification is kept.
// If email change is disallowed from profile, these can be removed.
const { generateVerificationCode } = require("../utils/helpers");
const { sendEmail } = require("../config/email");
const { renderEmailTemplate } = require("../utils/renderEmailTemplate");
// const { logAction } = require('../utils/logger'); // Uncomment if logging is re-enabled

/**
 * Updates the profile of the currently authenticated staff user.
 * Allows updating firstName, lastName, and password.
 * Email is typically not changed via this profile update for simplicity;
 * if it were, it would require re-verification.
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // From JWT (user_id is the UUID string)
    const { firstName, lastName, email, current_password, new_password } = req.body;
    // Note: 'email' might be sent from frontend but we'll ignore it if we decide not to allow email changes here.

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found." }); // Should be rare if token is valid
    }

    const updateData = {};
    let emailActuallyChanged = false; // Flag if we were to allow email changes
    let newVerificationCodeForEmail = null;

    if (firstName && firstName.trim() !== "" && firstName !== user.firstName) {
      updateData.firstName = firstName.trim();
    }
    if (lastName && lastName.trim() !== "" && lastName !== user.lastName) {
      updateData.lastName = lastName.trim();
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required to set a new password." });
      }
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Incorrect current password." });
      }
      // Add your staff password complexity validation here (e.g., min length, char types)
      if (new_password.length < 8) { // Example: min 8 characters for staff
        return res.status(400).json({ message: "New password must be at least 8 characters long." });
      }

      updateData.password = await bcrypt.hash(new_password, 10);
    } else if (current_password && !new_password) {
      // User provided current password but no new password
      return res.status(400).json({ message: "Please provide a new password if you intend to change it." });
    }


    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No changes provided to update." });
    }

    const updatedUserFromDb = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { // Return the updated user details (excluding password)
        id: true,
        firstName: true,
        lastName: true,
        email: true, // Current email
        email_verified: true,
        role: { select: { name: true } },

      },
    });

    // If email change was implemented and happened:
    /*
    if (emailActuallyChanged && newVerificationCodeForEmail) {
      const userFullName = `${updatedUserFromDb.firstName || ''} ${updatedUserFromDb.lastName || ''}`.trim();
      const htmlEmail = renderEmailTemplate('verificationEmail', { // Assuming a generic verification template
          name: userFullName || "User",
          verificationCode: newVerificationCodeForEmail,
      });
      if (htmlEmail) {
          await sendEmail(
            updatedUserFromDb.email, // Send to the new email
            'Verify Your New Email Address - XYZ LTD PMS',
            `Your email verification code is: ${newVerificationCodeForEmail}`,
            htmlEmail
          );
      } else {
          console.error("Could not render new email verification template for user:", userId);
      }
    }
    */


    res.status(200).json({
      message: `Profile updated successfully.${emailActuallyChanged ? " Please verify your new email address." : ""}`,
      user: { // Return data consistent with what login and /auth/me might return
        id: updatedUserFromDb.id,
        firstName: updatedUserFromDb.firstName,
        lastName: updatedUserFromDb.lastName,
        email: updatedUserFromDb.email,
        role: updatedUserFromDb.role.name,
        email_verified: updatedUserFromDb.email_verified,
        // permissions: updatedUserFromDb.role.permissions.map(p => p.permission.name) // If permissions were fetched
      },
    });
  } catch (error) {
    console.error("Update staff profile error:", error);
    res.status(500).json({ message: "Server error updating profile." });
  }
};

module.exports = {
  updateUserProfile,
};