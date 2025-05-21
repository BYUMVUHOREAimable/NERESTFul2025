// utils/helpers.js

/**
 * Generates a random 6-digit verification code.
 * @returns {string} A 6-digit string.
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generates a random token string (e.g., for password reset if using long tokens).
 * @param {number} length - The desired length of the token.
 * @returns {string} A random token string.
 */ 
const generateRandomToken = (length = 32) => {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
};

module.exports = {
  generateVerificationCode,
  generateRandomToken, // We might not use this one if fully OTP based
};
