// config/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';
// Consider a longer expiry if this is the only token
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '1d'; // e.g., 1 day

/**
 * Generates a JWT token.
 * @param {object} payload - The payload to include in the token (e.g., user_id, role_id).
 * @returns {string} The generated JWT.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT to verify.
 * @returns {object|null} The decoded payload if valid, otherwise null.
 */
const verifyToken = (token) => {
  console.log("Start of a token")
  console.log(token)
  console.log("End of a token")

  try {
    return jwt.verify(token, JWT_SECRET);

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('Token expired');
    } else {
      console.error('Invalid token:', error.message);
    }
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  TOKEN_EXPIRES_IN,
};